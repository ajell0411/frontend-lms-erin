import KelasRoster from "./kelas-roster";

export default async function KelasRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KelasRoster kelasId={Number(id)} />;
}