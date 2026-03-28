import { useEffect, useId, useState } from 'react';
import type { ReviewMood } from '../types';

interface ReviewFormFieldsProps {
  moodOptions: ReviewMood[];
  mood: ReviewMood;
  onMoodChange: (mood: ReviewMood) => void;
  body: string;
  onBodyChange: (value: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
  bodyLabel?: string;
  bodyPlaceholder?: string;
  fileLabel?: string;
  existingImageUrl?: string | null;
  existingImageAlt?: string;
  removeImage?: boolean;
  onToggleRemoveImage?: () => void;
}

export function ReviewFormFields({
  moodOptions,
  mood,
  onMoodChange,
  body,
  onBodyChange,
  file,
  onFileChange,
  disabled,
  bodyLabel = '오늘의 기록',
  bodyPlaceholder = '오늘 분위기나 동선을 짧고 자연스럽게 적어 보세요.',
  fileLabel = '사진 첨부',
  existingImageUrl = null,
  existingImageAlt = '기존 피드 이미지',
  removeImage = false,
  onToggleRemoveImage,
}: ReviewFormFieldsProps) {
  const fileInputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const visibleImageUrl = previewUrl ?? (!removeImage ? existingImageUrl : null);
  const canToggleRemoveImage = Boolean(existingImageUrl && onToggleRemoveImage);

  return (
    <>
      <div className="chip-row compact-gap review-form-fields__mood-row">
        {moodOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={option === mood ? 'chip is-active' : 'chip'}
            onClick={() => onMoodChange(option)}
            disabled={disabled}
          >
            {option}
          </button>
        ))}
      </div>

      <label className="route-builder-field review-form-fields__body-field">
        <span>{bodyLabel}</span>
        <textarea
          rows={4}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder={bodyPlaceholder}
          disabled={disabled}
        />
      </label>

      <div className="route-builder-field">
        <span>{fileLabel}</span>
        {visibleImageUrl && (
          <div className="review-card__image-frame review-form-fields__image-frame">
            <img
              src={visibleImageUrl}
              alt={previewUrl ? '새로 선택한 피드 이미지' : existingImageAlt}
              className="review-card__image"
            />
          </div>
        )}
        <label className={disabled ? 'file-picker is-disabled' : 'file-picker'} htmlFor={fileInputId}>
          <span>
            {file
              ? file.name
              : removeImage
                ? '기존 이미지를 삭제합니다'
                : existingImageUrl
                  ? '현재 이미지를 유지합니다'
                  : '사진을 골라주세요'}
          </span>
          <strong>{file ? '다시 선택' : '사진 선택'}</strong>
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        {(canToggleRemoveImage || file) && (
          <div className="chip-row compact-gap">
            {canToggleRemoveImage && (
              <button
                type="button"
                className={removeImage ? 'chip is-active' : 'chip'}
                onClick={onToggleRemoveImage}
                disabled={disabled}
              >
                이미지 삭제
              </button>
            )}
            {file && (
              <button
                type="button"
                className="chip"
                onClick={() => onFileChange(null)}
                disabled={disabled}
              >
                새 이미지 취소
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
