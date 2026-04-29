import { jsonResponse } from '../lib/http';
import { encodeFilterValue, getSupabaseKey, supabaseRequest } from '../lib/supabase';
function sanitizeFileName(fileName) { return String(fileName || 'upload.jpg').replace(/[^a-zA-Z0-9._-]+/g, '-'); }
function buildPublicStorageUrl(env, objectPath) { const normalizedPath = objectPath.split('/').map((segment) => encodeURIComponent(segment)).join('/'); return `${env.APP_SUPABASE_URL}/storage/v1/object/public/${env.APP_SUPABASE_STORAGE_BUCKET}/${normalizedPath}`; }
async function uploadReviewFile(env, sessionUser, file) { if (!env.APP_SUPABASE_URL || !env.APP_SUPABASE_STORAGE_BUCKET) {
    throw new Error('Supabase Storage 설정이 비어 있어요.');
} const storageKey = env.APP_SUPABASE_SERVICE_ROLE_KEY || getSupabaseKey(env); if (!storageKey) {
    throw new Error('Supabase Storage 권한 키가 비어 있어요.');
} const safeFileName = sanitizeFileName(file.name); const objectPath = `reviews/${sessionUser.id.replace(/[^a-zA-Z0-9_-]+/g, '_')}/${Date.now()}-${safeFileName}`; const uploadUrl = `${env.APP_SUPABASE_URL}/storage/v1/object/${env.APP_SUPABASE_STORAGE_BUCKET}/${objectPath.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`; const response = await fetch(uploadUrl, { method: 'POST', headers: { apikey: storageKey, Authorization: `Bearer ${storageKey}`, 'x-upsert': 'true', 'content-type': file.type || 'application/octet-stream', }, body: file, }); if (!response.ok) {
    const detail = await response.text();
    throw new Error(`이미지 업로드에 실패했어요. (${response.status}) ${detail}`);
} return { url: buildPublicStorageUrl(env, objectPath), fileName: safeFileName, contentType: file.type || 'application/octet-stream', }; }
async function readJsonBody(request) { try {
    return await request.json();
}
catch {
    throw new Error('요청 형식이 올바르지 않아요.');
} }
async function requireSessionUser(request, env, deps) { const sessionUser = await deps.readSessionUser(request, env); if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
} return { sessionUser }; }
async function readFeedRow(env, reviewId) { const rows = await supabaseRequest(env, `feed?select=feed_id,position_id,user_id&feed_id=eq.${encodeFilterValue(reviewId)}&limit=1`); return rows?.[0] ?? null; }
async function readCommentRow(env, commentId) { const rows = await supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,is_deleted&comment_id=eq.${encodeFilterValue(commentId)}&limit=1`); return rows?.[0] ?? null; }
export async function handleReviewUpload(request, env, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const formData = await request.formData(); const file = formData.get('file'); if (!(file instanceof File)) {
    return jsonResponse(400, { detail: '업로드할 이미지 파일이 필요해요.' }, env, request);
} if (!(file.type || '').startsWith('image/')) {
    return jsonResponse(400, { detail: '이미지 파일만 업로드할 수 있어요.' }, env, request);
} const maxUploadSize = Number(env.APP_MAX_UPLOAD_SIZE_BYTES ?? '5242880'); if (file.size > maxUploadSize) {
    return jsonResponse(413, { detail: '이미지는 5MB 이하로 올려 주세요.' }, env, request);
} const uploaded = await uploadReviewFile(env, sessionResult.sessionUser, file); return jsonResponse(200, uploaded, env, request); }
export async function handleCreateReview(request, env, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const payload = await readJsonBody(request); const placeId = String(payload.placeId ?? '').trim(); const stampId = String(payload.stampId ?? '').trim(); const body = String(payload.body ?? '').trim(); const mood = String(payload.mood ?? '설렘').trim(); const imageUrl = payload.imageUrl ? String(payload.imageUrl) : null; if (!placeId) {
    return jsonResponse(400, { detail: '장소 정보가 필요해요.' }, env, request);
} if (!stampId) {
    return jsonResponse(400, { detail: '피드를 쓰려면 해당 방문 스탬프가 필요해요.' }, env, request);
} if (!body) {
    return jsonResponse(400, { detail: '후기를 조금 더 적어 주세요.' }, env, request);
} const baseData = await deps.loadBaseData(env, sessionResult.sessionUser.id); const place = baseData.places.find((item) => item.id === placeId); if (!place) {
    return jsonResponse(404, { detail: '장소를 찾지 못했어요.' }, env, request);
} const stampRows = await supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,visit_ordinal,stamp_date,created_at&stamp_id=eq.${encodeFilterValue(stampId)}&limit=1`); const stampRow = stampRows?.[0] ?? null; if (!stampRow) {
    return jsonResponse(404, { detail: '방문 스탬프를 찾지 못했어요.' }, env, request);
} if (stampRow.user_id !== sessionResult.sessionUser.id || String(stampRow.position_id) !== String(place.positionId)) {
    return jsonResponse(403, { detail: '해당 장소의 방문 스탬프가 확인되어야 피드를 쓸 수 있어요.' }, env, request);
} const insertedRows = await supabaseRequest(env, 'feed?select=feed_id', { method: 'POST', body: JSON.stringify({ position_id: Number(place.positionId), user_id: sessionResult.sessionUser.id, stamp_id: Number(stampId), body, mood, badge: deps.badgeByMood[mood] ?? '현장 방문', image_url: imageUrl, }), }); const createdReview = await deps.loadSingleReview(env, insertedRows?.[0]?.feed_id, sessionResult.sessionUser.id); const createdNotification = await deps.createUserNotification(env, { userId: sessionResult.sessionUser.id, actorUserId: sessionResult.sessionUser.id, type: 'review-created', title: '피드 작성이 완료되었습니다.', body: `${place.name} 피드를 남겼어요.`, reviewId: insertedRows?.[0]?.feed_id ?? null, metadata: { placeId: place.id }, }); if (createdNotification?.notification_id) {
    const notification = await deps.loadNotificationById(env, createdNotification.notification_id);
    if (notification) {
        await deps.publishNotificationEvent(env, sessionResult.sessionUser.id, 'notification.created', { notification, unreadCount: await deps.countUnreadNotifications(env, sessionResult.sessionUser.id), });
    }
} return jsonResponse(201, createdReview, env, request); }
export async function handleUpdateReview(request, env, reviewId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} if (reviewRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내가 쓴 피드만 수정할 수 있어요.' }, env, request);
} const payload = await readJsonBody(request); const body = String(payload.body ?? '').trim(); const mood = String(payload.mood ?? '').trim(); const imageUrlProvided = Object.prototype.hasOwnProperty.call(payload, 'imageUrl'); const imageUrl = imageUrlProvided ? (payload.imageUrl ? String(payload.imageUrl) : null) : undefined; if (!body) {
    return jsonResponse(400, { detail: '후기를 조금 더 적어 주세요.' }, env, request);
} if (!mood) {
    return jsonResponse(400, { detail: '무드 태그를 선택해 주세요.' }, env, request);
} await supabaseRequest(env, `feed?feed_id=eq.${encodeFilterValue(reviewId)}`, { method: 'PATCH', body: JSON.stringify({ body, mood, ...(imageUrlProvided ? { image_url: imageUrl } : {}), badge: deps.badgeByMood[mood] ?? '현장 방문', updated_at: new Date().toISOString(), }), }); const updatedReview = await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id); return jsonResponse(200, updatedReview, env, request); }
export async function handleCreateComment(request, env, reviewId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} const payload = await readJsonBody(request); const body = String(payload.body ?? '').trim(); let parentId = payload.parentId ? Number(payload.parentId) : null; let parentComment = null; if (!body) {
    return jsonResponse(400, { detail: '댓글을 조금 더 적어 주세요.' }, env, request);
} if (parentId) {
    parentComment = await readCommentRow(env, parentId);
    if (!parentComment || String(parentComment.feed_id) !== String(reviewId)) {
        return jsonResponse(400, { detail: '같은 후기 안의 댓글에만 답글을 달 수 있어요.' }, env, request);
    }
    if (parentComment.parent_id) {
        parentId = Number(parentComment.parent_id);
    }
} const insertedRows = await supabaseRequest(env, 'user_comment?select=comment_id', { method: 'POST', body: JSON.stringify({ feed_id: Number(reviewId), user_id: sessionResult.sessionUser.id, parent_id: parentId, body, is_deleted: false, }), }); const createdCommentId = insertedRows?.[0]?.comment_id ?? null; const actorUserId = sessionResult.sessionUser.id; const reviewOwnerId = reviewRow.user_id; if (parentComment && parentComment.user_id && parentComment.user_id !== actorUserId) {
    const createdNotification = await deps.createUserNotification(env, { userId: parentComment.user_id, actorUserId, type: 'comment-reply', title: '내 댓글에 답글이 달렸습니다.', body, reviewId, commentId: createdCommentId, });
    if (createdNotification?.notification_id) {
        const notification = await deps.loadNotificationById(env, createdNotification.notification_id);
        if (notification) {
            await deps.publishNotificationEvent(env, parentComment.user_id, 'notification.created', { notification, unreadCount: await deps.countUnreadNotifications(env, parentComment.user_id), });
        }
    }
} if (reviewOwnerId && reviewOwnerId !== actorUserId && (!parentComment || parentComment.user_id !== reviewOwnerId)) {
    const createdNotification = await deps.createUserNotification(env, { userId: reviewOwnerId, actorUserId, type: 'review-comment', title: '내 피드에 댓글이 달렸습니다.', body, reviewId, commentId: createdCommentId, });
    if (createdNotification?.notification_id) {
        const notification = await deps.loadNotificationById(env, createdNotification.notification_id);
        if (notification) {
            await deps.publishNotificationEvent(env, reviewOwnerId, 'notification.created', { notification, unreadCount: await deps.countUnreadNotifications(env, reviewOwnerId), });
        }
    }
} const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? []; return jsonResponse(200, comments, env, request); }
export async function handleUpdateComment(request, env, reviewId, commentId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} const commentRow = await readCommentRow(env, commentId); if (!commentRow || String(commentRow.feed_id) !== String(reviewId)) {
    return jsonResponse(404, { detail: '댓글을 찾지 못했어요.' }, env, request);
} if (commentRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 댓글만 수정할 수 있어요.' }, env, request);
} if (commentRow.is_deleted) {
    return jsonResponse(400, { detail: '삭제된 댓글은 수정할 수 없어요.' }, env, request);
} const payload = await readJsonBody(request); const body = String(payload.body ?? '').trim(); if (!body) {
    return jsonResponse(400, { detail: '댓글을 조금 더 적어 주세요.' }, env, request);
} await supabaseRequest(env, `user_comment?comment_id=eq.${encodeFilterValue(commentId)}`, { method: 'PATCH', body: JSON.stringify({ body, updated_at: new Date().toISOString(), }), }); const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? []; return jsonResponse(200, comments, env, request); }
export async function handleDeleteComment(request, env, reviewId, commentId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} const commentRow = await readCommentRow(env, commentId); if (!commentRow || String(commentRow.feed_id) !== String(reviewId)) {
    return jsonResponse(404, { detail: '댓글을 찾지 못했어요.' }, env, request);
} if (commentRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 댓글만 삭제할 수 있어요.' }, env, request);
} await supabaseRequest(env, `user_comment?comment_id=eq.${encodeFilterValue(commentId)}`, { method: 'PATCH', body: JSON.stringify({ body: '[deleted]', is_deleted: true, updated_at: new Date().toISOString(), }), }); const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? []; return jsonResponse(200, comments, env, request); }
export async function handleDeleteReview(request, env, reviewId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} if (reviewRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내가 쓴 피드만 삭제할 수 있어요.' }, env, request);
} await supabaseRequest(env, `feed?feed_id=eq.${encodeFilterValue(reviewId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' }, }); return jsonResponse(200, { reviewId: String(reviewId), deleted: true }, env, request); }
export async function handleToggleReviewLike(request, env, reviewId, deps) { const sessionResult = await requireSessionUser(request, env, deps); if (sessionResult.response) {
    return sessionResult.response;
} const reviewRow = await readFeedRow(env, reviewId); if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
} const existingRows = await supabaseRequest(env, `feed_like?select=feed_like_id&feed_id=eq.${encodeFilterValue(reviewId)}&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&limit=1`); const existing = existingRows?.[0] ?? null; if (existing) {
    await supabaseRequest(env, `feed_like?feed_like_id=eq.${encodeFilterValue(existing.feed_like_id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' }, });
}
else {
    await supabaseRequest(env, 'feed_like?select=feed_like_id', { method: 'POST', body: JSON.stringify({ feed_id: Number(reviewId), user_id: sessionResult.sessionUser.id, }), });
} const likeRows = await supabaseRequest(env, `feed_like?select=feed_like_id&feed_id=eq.${encodeFilterValue(reviewId)}`); return jsonResponse(200, { reviewId: String(reviewId), likeCount: likeRows.length, likedByMe: !existing, }, env, request); }

