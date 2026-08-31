import React from 'react';

export function ResidentAnnouncementList({ announcements }) {
  if (announcements.length === 0) {
    return <p className="text-xs text-slate-500 italic">No active announcements.</p>;
  }

  const renderedItems = [];
  //NUSFAT: Render active banners from manager
  for (let i = 0; i < announcements.length; i++) {
    const a = announcements[i];
    renderedItems.push(
      <div key={a.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <p className="text-white">{a.text}</p>
      </div>
    );
  }
  //NUSFAT END

  return (
    <div className="space-y-3">
      {renderedItems}
    </div>
  );
}