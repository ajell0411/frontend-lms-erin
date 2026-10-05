import JurusanClasses from "./jurusan-classes";

export default async function JurusanClassesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JurusanClasses jurusanId={Number(id)} />;
}