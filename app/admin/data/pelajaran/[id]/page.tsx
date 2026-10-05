import PelajaranTeachers from "./pelajaran-teachers";

export default async function PelajaranTeachersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PelajaranTeachers pelajaranId={Number(id)} />;
}