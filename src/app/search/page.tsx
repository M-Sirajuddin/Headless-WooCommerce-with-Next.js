import { redirect } from "next/navigation";

interface PageProps {
  searchParams?: {
    search?: string;
  };
}

export default function SearchPage({ searchParams }: PageProps) {
  const query = searchParams?.search || "";
  redirect(`/products?search=${encodeURIComponent(query)}`);
}
