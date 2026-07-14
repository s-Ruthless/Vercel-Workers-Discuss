/**
 * 状态管理 - 使用发布-订阅模式
 */

import { auth } from '../utils/auth.js';

const STORAGE_KEY = 'vwd_user_info';

function loadUserInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        name: parsed.name || '',
        email: parsed.email || '',
        url: parsed.url || '',
      };
    }
  } catch (e) {}
  return { name: '', email: '', url: '' };
}

function saveUserInfo(name, email, url) {
  try {
    const data = { name, email, url };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

/**
 * 简单的 Store 类
 */
class Store {
  constructor(initialState) {
    this.state = { ...initialState };
    this.listeners = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => {
      listener(this.state, prevState);
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

/**
 * 创建评论状态管理 Store
 */
export function createCommentStore(config, fetchComments, submitComment, likeCommentFn) {
  const savedInfo = loadUserInfo();

  const store = new Store({
    comments: [],
    loading: true,
    error: null,
    successMessage: '',

    pagination: {
      page: 1,
      limit: config.pageSize || 20,
      total: 0,
      totalCount: 0,
    },

    form: {
      name: savedInfo.name || '',
      email: savedInfo.email || '',
      url: savedInfo.url || '',
      content: '',
    },
    formErrors: {},
    submitting: false,

    replyingTo: null,
    replyContent: '',
    replyError: null,
    likeCount: 0,
    liked: false,
    commentLikeLoadingId: null,
  });

  // 监听用户信息变化，自动保存到 localStorage
  store.subscribe((state, prevState) => {
    if (
      state.form.name !== prevState.form.name ||
      state.form.email !== prevState.form.email ||
      state.form.url !== prevState.form.url
    ) {
      saveUserInfo(state.form.name, state.form.email, state.form.url);
    }
  });

  async function loadComments(page = 1) {
    store.setState({ loading: true, error: null });

    try {
      const response = await fetchComments(page, store.getState().pagination.limit);
      store.setState({
        comments: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalCount: response.pagination.totalCount,
        },
        loading: false,
      });
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '加载评论失败',
        loading: false,
      });
    }
  }

  function setLikeState(likeCount, liked) {
    const safeCount = typeof likeCount === 'number' && Number.isFinite(likeCount) && likeCount >= 0 ? likeCount : 0;
    store.setState({ likeCount: safeCount, liked: !!liked });
  }

  async function likeComment(commentId, isLike = true) {
    const state = store.getState();
    if (!likeCommentFn || state.commentLikeLoadingId === commentId) return;

    const id = typeof commentId === 'number'
      ? commentId
      : typeof commentId === 'string' && commentId.trim()
        ? Number.parseInt(commentId.trim(), 10)
        : NaN;
    if (!Number.isFinite(id) || id <= 0) return;

    store.setState({ commentLikeLoadingId: id });

    try {
      const safeComments = Array.isArray(state.comments) ? state.comments : [];
      const delta = isLike ? 1 : -1;
      const nextComments = safeComments.map((item) => {
        if (!item || typeof item.id !== 'number') return item;
        if (item.id === id) {
          const current = typeof item.likes === 'number' && Number.isFinite(item.likes) && item.likes >= 0 ? item.likes : 0;
          return { ...item, likes: Math.max(0, current + delta) };
        }
        if (Array.isArray(item.replies) && item.replies.length > 0) {
          const updatedReplies = item.replies.map((reply) => {
            if (!reply || typeof reply.id !== 'number') return reply;
            if (reply.id === id) {
              const current = typeof reply.likes === 'number' && Number.isFinite(reply.likes) && reply.likes >= 0 ? reply.likes : 0;
              return { ...reply, likes: Math.max(0, current + delta) };
            }
            return reply;
          });
          return { ...item, replies: updatedReplies };
        }
        return item;
      });
      store.setState({ comments: nextComments });
      await likeCommentFn(id, isLike);
    } catch (e) {
    } finally {
      const latest = store.getState();
      if (latest.commentLikeLoadingId === id) {
        store.setState({ commentLikeLoadingId: null });
      }
    }
  }

  async function submitNewComment() {
    const state = store.getState();
    const form = state.form;

    const { validateCommentForm } = await import('@/utils/validator.js');
    const validation = validateCommentForm(form);
    if (!validation.valid) {
      store.setState({ formErrors: validation.errors });
      return false;
    }

    store.setState({
      formErrors: {},
      submitting: true,
      error: null,
      successMessage: '',
    });

    try {
      const result = await submitComment({
        name: form.name,
        email: form.email,
        url: form.url,
        content: form.content,
        adminToken: auth.getToken()
      });

      const successMessage = result && typeof result.message === 'string'
        ? result.message
        : config.requireReview
          ? '已提交评论，待管理员审核后显示'
          : '评论已提交';

      store.setState({
        form: { ...form, content: '' },
        submitting: false,
        successMessage,
      });

      await loadComments(state.pagination.page);
      return true;
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '提交评论失败',
        submitting: false,
        successMessage: '',
      });
      return false;
    }
  }

  async function submitReply(parentId) {
    const state = store.getState();

    if (!state.replyContent.trim()) return false;

    const { validateReplyUserInfo } = await import('@/utils/validator.js');
    const validation = validateReplyUserInfo(state.form);
    if (!validation.valid) {
      const errorMessages = Object.values(validation.errors).join('；');
      store.setState({ replyError: errorMessages });
      return false;
    }

    store.setState({
      formErrors: {},
      submitting: true,
      replyError: null,
    });

    try {
      await submitComment({
        name: state.form.name,
        email: state.form.email,
        url: state.form.url,
        content: state.replyContent,
        parentId,
        adminToken: auth.getToken()
      });

      store.setState({
        replyContent: '',
        replyingTo: null,
        submitting: false,
      });

      await loadComments(state.pagination.page);
      return true;
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '提交回复失败',
        submitting: false,
      });
      return false;
    }
  }

  function startReply(commentId) {
    store.setState({
      replyingTo: commentId,
      replyContent: '',
      replyError: null,
    });
  }

  function cancelReply() {
    store.setState({
      replyingTo: null,
      replyContent: '',
      replyError: null,
    });
  }

  function updateFormField(field, value) {
    const form = { ...store.getState().form };
    form[field] = value;
    store.setState({ form });
  }

  function updateReplyContent(content) {
    store.setState({ replyContent: content });
  }

  function clearReplyError() {
    store.setState({ replyError: null });
  }

  function clearError() {
    store.setState({ error: null });
  }

  function clearSuccess() {
    store.setState({ successMessage: '' });
  }

  function goToPage(page) {
    const totalPages = store.getState().pagination.total;
    if (page >= 1 && page <= totalPages) {
      loadComments(page);
    }
  }

  return {
    store,
    getTotalPages: () => store.getState().pagination.total,
    loadComments,
    submitNewComment,
    submitReply,
    startReply,
    cancelReply,
    updateFormField,
    updateReplyContent,
    clearReplyError,
    clearError,
    clearSuccess,
    goToPage,
    setLikeState,
    likeComment,
  };
}
