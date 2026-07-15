/**
 * CommentList 评论列表容器组件
 */
import { Component } from './Component.js';
import { CommentItem } from './CommentItem.js';
import { Loading } from './Loading.js';
import { Pagination } from './Pagination.js';

export class CommentList extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.t = props.t || ((k) => k);
    this.loadingComponent = null;
    this.paginationComponent = null;
    this.commentItems = new Map();
  }

  render() {
    const { comments, loading, error, currentPage, totalPages } = this.props;
    this.empty(this.container);

    if (loading && comments.length === 0) {
      this.loadingComponent = new Loading(this.container, { text: '加载评论中...' });
      this.loadingComponent.render();
      this.elements.root = this.loadingComponent.elements.root;
      return;
    }

    if (error && comments.length === 0) {
      const errorEl = this.createElement('div', {
        className: 'vwd-error',
        children: [
          this.createTextElement('span', error),
          this.createElement('button', {
            className: 'vwd-error-retry',
            attributes: {
              type: 'button',
              onClick: () => this.handleRetry()
            },
            text: '重试'
          })
        ]
      });
      this.elements.root = errorEl;
      this.container.appendChild(errorEl);
      return;
    }

    const root = this.createElement('div', {
      className: 'vwd-comment-list'
    });

    if (comments.length > 0) {
      const commentsContainer = this.createElement('div', {
        className: 'vwd-comments'
      });

      this.commentItems.clear();

      comments.forEach((comment) => {
        const commentItem = new CommentItem(commentsContainer, {
          comment,
          replyingTo: this.props.replyingTo,
          replyContent: this.props.replyContent,
          replyError: this.props.replyError,
          submitting: this.props.submitting,
          currentUser: this.props.currentUser,
          onUpdateUserInfo: this.props.onUpdateUserInfo,
          adminBadge: this.props.adminBadge,
          enableCommentLike: this.props.enableCommentLike,
          replyPlaceholder: this.props.replyPlaceholder,
          emojiPacks: this.props.emojiPacks,
          apiOrigin: this.props.apiOrigin,
          enableEmoji: this.props.enableEmoji,
          onReply: (commentId) => this.handleReply(commentId),
          onSubmitReply: (commentId) => this.handleSubmitReply(commentId),
          onCancelReply: () => this.handleCancelReply(),
          onUpdateReplyContent: (content) => this.handleUpdateReplyContent(content),
          onClearReplyError: () => this.handleClearReplyError(),
          onLikeComment: (commentId, isLike) => this.handleLikeComment(commentId, isLike),
          t: this.props.t
        });
        commentItem.render();
        this.commentItems.set(comment.id, commentItem);
      });

      root.appendChild(commentsContainer);
    } else {
      const emptyEl = this.createElement('div', {
        className: 'vwd-empty',
        children: [
          this.createTextElement('p', this.t('noComments'), 'vwd-empty-text')
        ]
      });
      root.appendChild(emptyEl);
    }

    if (totalPages > 1) {
      const paginationContainer = this.createElement('div');
      root.appendChild(paginationContainer);

      this.paginationComponent = new Pagination(paginationContainer, {
        currentPage,
        totalPages,
        onPrev: () => this.handlePrevPage(),
        onNext: () => this.handleNextPage(),
        onGoTo: (page) => this.handleGoToPage(page)
      });
      this.paginationComponent.render();
    } else {
      this.paginationComponent = null;
    }

    this.elements.root = root;
    this.container.appendChild(root);
  }

  updateProps(prevProps) {
    if (this.props.loading !== prevProps.loading && !this.props.loading) {
      this.render();
      return;
    }

    if (this.props.comments !== prevProps.comments) {
      this.render();
      return;
    }

    if (this.props.replyingTo !== prevProps.replyingTo ||
        this.props.replyError !== prevProps.replyError ||
        this.props.submitting !== prevProps.submitting ||
        this.props.currentUser !== prevProps.currentUser) {
      this.commentItems.forEach((commentItem) => {
        commentItem.setProps({
          replyingTo: this.props.replyingTo,
          replyContent: this.props.replyContent,
          replyError: this.props.replyError,
          submitting: this.props.submitting,
          currentUser: this.props.currentUser,
          enableCommentLike: this.props.enableCommentLike,
          emojiPacks: this.props.emojiPacks,
          apiOrigin: this.props.apiOrigin,
          enableEmoji: this.props.enableEmoji,
          onLikeComment: (commentId, isLike) => this.handleLikeComment(commentId, isLike)
        });
      });
      return;
    }

    if (this.paginationComponent) {
      const pageChanged =
        this.props.currentPage !== prevProps.currentPage ||
        this.props.totalPages !== prevProps.totalPages;

      if (pageChanged) {
        this.paginationComponent.props.currentPage = this.props.currentPage;
        this.paginationComponent.props.totalPages = this.props.totalPages;
        this.paginationComponent.updateProps();
      }
    }
  }

  handleRetry() {
    if (this.props.onRetry) this.props.onRetry();
  }

  handleReply(commentId) {
    if (this.props.onReply) this.props.onReply(commentId);
  }

  handleSubmitReply(commentId) {
    if (this.props.onSubmitReply) this.props.onSubmitReply(commentId);
  }

  handleCancelReply() {
    if (this.props.onCancelReply) this.props.onCancelReply();
  }

  handleUpdateReplyContent(content) {
    if (this.props.onUpdateReplyContent) this.props.onUpdateReplyContent(content);
  }

  handleClearReplyError() {
    if (this.props.onClearReplyError) this.props.onClearReplyError();
  }

  handleLikeComment(commentId, isLike) {
    if (this.props.onLikeComment) this.props.onLikeComment(commentId, isLike);
  }

  handlePrevPage() {
    if (this.props.onPrevPage) this.props.onPrevPage();
  }

  handleNextPage() {
    if (this.props.onNextPage) this.props.onNextPage();
  }

  handleGoToPage(page) {
    if (this.props.onGoToPage) this.props.onGoToPage(page);
  }
}
