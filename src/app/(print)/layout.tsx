/** Pages meant for paper: no sidebar or top bar, white background. */
export default function PrintLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col bg-white print:block">{children}</div>
  );
}
