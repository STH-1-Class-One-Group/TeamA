"""Comment tree helpers shared across repository flows."""

from __future__ import annotations

from .db_models import UserComment
from .models import CommentOut
from .repository_support_time import format_datetime


def build_comment_tree(comments: list[UserComment]) -> list[CommentOut]:
    ordered_comments = sorted(comments, key=lambda item: (item.created_at, item.comment_id))
    comment_rows_by_id = {comment.comment_id: comment for comment in ordered_comments}
    nodes: dict[int, CommentOut] = {}
    roots: list[CommentOut] = []

    for comment in ordered_comments:
        nodes[comment.comment_id] = CommentOut(
            id=str(comment.comment_id),
            userId=comment.user_id,
            author=comment.user.nickname if comment.user else "이름 없음",
            body="삭제된 댓글입니다." if comment.is_deleted else comment.body,
            parentId=str(comment.parent_id) if comment.parent_id else None,
            isDeleted=comment.is_deleted,
            createdAt=format_datetime(comment.created_at),
            replies=[],
        )

    for comment in ordered_comments:
        node = nodes[comment.comment_id]
        parent = comment_rows_by_id.get(comment.parent_id) if comment.parent_id else None
        root_parent_id = None
        if parent:
            root_parent_id = parent.parent_id or parent.comment_id

        if root_parent_id and root_parent_id in nodes:
            nodes[root_parent_id].replies.append(node)
        else:
            roots.append(node)

    def has_live_descendant(node: CommentOut) -> bool:
        return any((not reply.is_deleted) or has_live_descendant(reply) for reply in node.replies)

    def collapse_deleted_nodes(comment_nodes: list[CommentOut]) -> list[CommentOut]:
        visible_nodes: list[CommentOut] = []
        for node in comment_nodes:
            node.replies = collapse_deleted_nodes(node.replies)
            if node.is_deleted:
                if has_live_descendant(node):
                    visible_nodes.append(node)
                continue
            visible_nodes.append(node)
        return visible_nodes

    return collapse_deleted_nodes(roots)


def count_visible_comments(comments: list[UserComment]) -> int:
    ordered_comments = sorted(comments, key=lambda item: (item.created_at, item.comment_id))
    if not ordered_comments:
        return 0

    comment_rows_by_id = {comment.comment_id: comment for comment in ordered_comments}
    replies_by_root_id: dict[int, list[UserComment]] = {}
    roots: list[UserComment] = []

    for comment in ordered_comments:
        parent = comment_rows_by_id.get(comment.parent_id) if comment.parent_id else None
        root_parent_id = None
        if parent:
            root_parent_id = parent.parent_id or parent.comment_id

        if root_parent_id and root_parent_id in comment_rows_by_id:
            replies_by_root_id.setdefault(root_parent_id, []).append(comment)
        else:
            roots.append(comment)

    def count_node(comment: UserComment) -> int:
        visible_reply_count = sum(count_node(reply) for reply in replies_by_root_id.get(comment.comment_id, []))
        if comment.is_deleted and visible_reply_count == 0:
            return 0
        return 1 + visible_reply_count

    return sum(count_node(root) for root in roots)
