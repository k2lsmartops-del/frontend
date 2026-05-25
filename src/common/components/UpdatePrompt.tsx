import { useServiceWorkerUpdate } from '@/common/hooks/useServiceWorkerUpdate';

export default function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between rounded-xl bg-k2l-gray-900 p-4 text-white shadow-lg"
    >
      <span className="text-sm">Une nouvelle version est disponible</span>
      <button
        onClick={applyUpdate}
        className="ml-4 whitespace-nowrap rounded-lg bg-k2l-primary px-4 py-2 text-sm font-medium text-white"
      >
        Mettre à jour
      </button>
    </div>
  );
}
