import { createCompany } from "../actions";

export default function NewCompany() {
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="serif text-xl text-ink mb-6">Add a company</h1>
      <form action={createCompany} className="flex flex-col gap-3">
        <input name="name" required placeholder="Company name" className="px-4 py-3 border border-line text-sm" />
        <button className="px-4 py-3 bg-teal text-white text-sm">Add company</button>
      </form>
    </div>
  );
}
