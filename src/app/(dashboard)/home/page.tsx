import { auth, signOut } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Airvibe</h1>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm px-3 py-2 bg-gray-100 rounded-md">
            Se déconnecter
          </button>
        </form>
      </div>
      <div className="mt-8 space-y-2">
        <p>Connecté en tant que: {session?.user?.email ?? "inconnu"}</p>
        <div className="rounded-lg border p-4">
          <UploadFlightsForm />
        </div>
      </div>
    </div>
  );
}

function UploadFlightsForm() {
  return (
    <form className="space-y-3" action="/api/flights" method="POST" encType="multipart/form-data">
      <div>
        <label className="block text-sm font-medium mb-1">Importer des vols (.igc ou .zip)</label>
        <input
          type="file"
          name="files"
          multiple
          accept=".igc,.zip,application/zip"
          className="block w-full text-sm"
        />
      </div>
      <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
        Importer
      </button>
    </form>
  );
}


