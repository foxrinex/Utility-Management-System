import React, { useState } from 'react';

export function ResidentRegistryList({ outages, user, handleDeleteReport, handleSubmitReview }) {
  const renderedRegistryItems = [];

  for (let i = 0; i < outages.length; i++) {
    const item = outages[i];

    renderedRegistryItems.push(
      <RegistryItem
        key={item._id}
        item={item}
        user={user}
        handleDeleteReport={handleDeleteReport}
        handleSubmitReview={handleSubmitReview}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {renderedRegistryItems}
    </div>
  );
}

// --- SINGLE REGISTRY CARD, INCLUDING RESIDENT REVIEW FORM ---
function RegistryItem({ item, user, handleDeleteReport, handleSubmitReview }) {
  const isOwner = item.reporterId === user.id;
  const isResolved = item.status === 'RESOLVED';
  const hasReview = Boolean(item.userRating && item.userRating > 0);

  // Controls whether the review form is showing. Starts open automatically
  // for a first-time review (no existing review yet), closed for an
  // already-submitted review until the resident taps "Edit".
  const [isEditing, setIsEditing] = useState(false);

  const [rating, setRating] = useState(item.userRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(item.userComment || '');
  const [submitting, setSubmitting] = useState(false);

  const startEditing = () => {
    setRating(item.userRating || 0);
    setComment(item.userComment || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setRating(item.userRating || 0);
    setComment(item.userComment || '');
    setIsEditing(false);
  };

  const onSubmitReview = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      await handleSubmitReview(item._id, rating, comment);
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-cyan-400 text-[10px] font-black uppercase tracking-wider">{item.utilityType}</span>
          <h4 className="text-lg font-bold">{item.locationName}</h4>
        </div>
        <span className="text-[10px] font-bold text-slate-500">REPORTED BY: {item.reporterName}</span>
      </div>

      <p className="text-sm text-slate-300 mt-3 italic">"{item.description}"</p>

      {isOwner && (
        <button
          onClick={() => handleDeleteReport(item._id)}
          className="mt-4 text-[10px] text-red-400 font-bold uppercase underline hover:text-red-300"
        >
          Remove My Report
        </button>
      )}

      {/* Already-submitted review, read-only, with an Edit option */}
      {isOwner && isResolved && hasReview && !isEditing && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Review</span>
            <button
              onClick={startEditing}
              className="text-[10px] text-cyan-400 font-bold uppercase underline hover:text-cyan-300"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= item.userRating ? 'text-amber-400' : 'text-slate-700'}>
                ★
              </span>
            ))}
          </div>
          {item.userComment && (
            <p className="text-sm text-slate-300 mt-2 italic">"{item.userComment}"</p>
          )}
        </div>
      )}

      {/* Review form: shown for a first-time review, or while editing an existing one */}
      {isOwner && isResolved && (!hasReview || isEditing) && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {hasReview ? 'Edit Your Review' : 'Leave a Review'}
          </span>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-xl leading-none"
              >
                <span className={star <= (hoverRating || rating) ? 'text-amber-400' : 'text-slate-700'}>
                  ★
                </span>
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the repair handled?"
            className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 placeholder-slate-600"
            rows={2}
          />
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onSubmitReview}
              disabled={rating < 1 || submitting}
              className="text-[10px] text-cyan-400 font-bold uppercase underline hover:text-cyan-300 disabled:text-slate-600 disabled:no-underline"
            >
              {submitting ? 'Submitting...' : hasReview ? 'Save Changes' : 'Submit Review'}
            </button>
            {hasReview && (
              <button
                onClick={cancelEditing}
                disabled={submitting}
                className="text-[10px] text-slate-500 font-bold uppercase underline hover:text-slate-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}