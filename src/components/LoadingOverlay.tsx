interface Props {
  progress: string;
}

export function LoadingOverlay({ progress }: Props) {
  return (
    <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-sm text-sky-700">{progress}</div>
      </div>
    </div>
  );
}
