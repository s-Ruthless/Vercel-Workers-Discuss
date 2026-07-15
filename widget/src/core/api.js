/**
 * API 请求封装
 * 与 VWD 后端 API 通信
 */

/**
 * 创建 API 客户端
 * @param {Object} config - 配置对象
 * @returns {Object}
 */
export function createApiClient(config) {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');

  function getLikeUserId() {
    try {
      const storageKey = 'vwd_like_uid';
      let token = localStorage.getItem(storageKey);
      if (!token) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          token = crypto.randomUUID();
        } else {
          token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        }
        localStorage.setItem(storageKey, token);
      }
      return token;
    } catch (e) {
      return 'anonymous';
    }
  }

  /**
   * 获取评论列表
   */
  async function fetchComments(page = 1, limit = 20) {
    const params = new URLSearchParams({
      post_slug: config.postSlug,
      page: page.toString(),
      limit: limit.toString(),
      nested: 'true',
    });

    if (config.avatarPrefix) {
      params.set('avatar_prefix', config.avatarPrefix);
    }

    if (config.siteId) {
      params.set('site_id', config.siteId);
    }

    const response = await fetch(`${baseUrl}/api/comments?${params}`);
    if (!response.ok) {
      throw new Error(`获取评论失败：${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * 提交评论
   */
  async function submitComment(data) {
    const response = await fetch(`${baseUrl}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_slug: config.postSlug,
        post_title: config.postTitle,
        post_url: config.postUrl,
        name: data.name,
        email: data.email,
        url: data.url || undefined,
        content: data.content,
        parent_id: data.parentId,
        adminToken: data.adminToken,
        site_id: config.siteId
      }),
    });

    if (!response.ok) {
      let msg = response.statusText;
      try {
        const json = await response.json();
        if (json.message) msg = json.message;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  }

  /**
   * 验证管理员密钥
   */
  async function verifyAdminKey(key) {
    const response = await fetch(`${baseUrl}/api/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken: key })
    });
    if (!response.ok) {
      let msg = response.statusText;
      try {
        const json = await response.json();
        if (json.message) msg = json.message;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  }

  /**
   * 获取文章点赞状态
   */
  async function getLikeStatus() {
    const params = new URLSearchParams({
      post_slug: config.postUrl
    });
    const headers = {
      'X-VWD-Like-User': getLikeUserId()
    };
    const response = await fetch(`${baseUrl}/api/like?${params.toString()}`, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      return { liked: false, alreadyLiked: false, totalLikes: 0 };
    }
    return response.json();
  }

  /**
   * 文章点赞
   */
  async function likePage() {
    const headers = {
      'Content-Type': 'application/json',
      'X-VWD-Like-User': getLikeUserId()
    };
    const response = await fetch(`${baseUrl}/api/like`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        postSlug: config.postSlug,
        postTitle: config.postTitle,
        postUrl: config.postUrl
      })
    });
    if (!response.ok) {
      let msg = response.statusText;
      try {
        const json = await response.json();
        if (json.message) msg = json.message;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  }

  /**
   * 评论点赞/取消点赞
   */
  async function likeComment(commentId, isLike = true) {
    const id = typeof commentId === 'number'
      ? commentId
      : typeof commentId === 'string' && commentId.trim()
        ? Number.parseInt(commentId.trim(), 10)
        : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid comment id');
    }
    const method = isLike ? 'POST' : 'DELETE';
    const response = await fetch(`${baseUrl}/api/comments/like`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) {
      let msg = response.statusText;
      try {
        const json = await response.json();
        if (json.message) msg = json.message;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  }

  /**
   * 获取说说列表
   */
  async function fetchSays(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (config.siteId) {
      params.set('site_id', config.siteId);
    }

    const response = await fetch(`${baseUrl}/api/says?${params}`);
    if (!response.ok) {
      throw new Error(`获取说说失败：${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * 说说点赞
   */
  async function likeSay(id) {
    const headers = {
      'Content-Type': 'application/json',
      'X-VWD-Like-User': getLikeUserId()
    };
    const response = await fetch(`${baseUrl}/api/says/like`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, siteId: config.siteId })
    });
    if (!response.ok) {
      let msg = response.statusText;
      try {
        const json = await response.json();
        if (json.message) msg = json.message;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  }

  return {
    fetchComments,
    submitComment,
    verifyAdminKey,
    getLikeStatus,
    likePage,
    likeComment,
    fetchSays,
    likeSay
  };
}
