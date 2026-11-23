export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mc-preview">{children}</div>;
}
