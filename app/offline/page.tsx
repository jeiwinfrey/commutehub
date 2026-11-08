import Image from "next/image";

export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center p-8 pt-[calc(env(safe-area-inset-top)+32px)] text-center">
      <div className="flex flex-col items-center">
        <Image src="/illustrations/offline.svg" alt="A parked jeepney with no connection" width={240} height={240} />
        <h1 className="mb-2 text-[26px]">You're offline</h1>
        <p className="text-[15px]">Reconnect to see live ETAs. Your last routes are still saved.</p>
      </div>
    </main>
  );
}
