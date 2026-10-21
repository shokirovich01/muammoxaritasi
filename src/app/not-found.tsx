import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Sahifa topilmadi.</p>
      <Link href="/" className="mt-4 inline-block font-semibold text-brand-700">Bosh sahifaga qaytish</Link>
    </div>
  );
}
