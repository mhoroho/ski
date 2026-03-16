interface Props {
  progress: string;
}

export function LoadingOverlay({ progress }: Props) {
  return (
    <div className="absolute inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-sm text-slate-300">{progress}</div>
      </div>
    </div>
  );
}
