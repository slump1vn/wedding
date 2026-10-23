// Nhúng video từ Google Drive (file phải được chia sẻ "Bất kỳ ai có đường liên kết")
const DriveVideo = ({ id, title }: { id: string; title: string }) => (
  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md">
    <iframe
      src={`https://drive.google.com/file/d/${id}/preview`}
      title={title}
      allow="autoplay; fullscreen"
      allowFullScreen
      loading="lazy"
      className="h-full w-full border-0"
    />
  </div>
);

export default DriveVideo;
