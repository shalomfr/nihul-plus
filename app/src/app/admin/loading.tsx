export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-[#64748b] font-medium">טוען...</p>
      </div>
    </div>
  );
}
