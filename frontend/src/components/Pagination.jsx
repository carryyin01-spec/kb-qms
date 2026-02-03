import React from 'react';

const Pagination = ({ page, total, pageSize, onPageChange, onPrevious, onNext }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 0) return null;

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        共 <span className="font-semibold text-gray-900">{total}</span> 条记录
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onPrevious}
          disabled={page === 1}
        >
          ← 上一页
        </button>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">第</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={page}
            onChange={(e) => onPageChange(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
            className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
          />
          <span className="text-sm text-gray-600">页 / 共 {totalPages} 页</span>
        </div>
        <button
          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNext}
          disabled={page === totalPages}
        >
          下一页 →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
