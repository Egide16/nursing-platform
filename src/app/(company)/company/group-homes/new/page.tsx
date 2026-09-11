import { createGroupHome } from "../../actions";

export default function NewGroupHome() {
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="serif text-xl text-ink mb-6">Add a group home</h1>
      <form action={createGroupHome} className="flex flex-col gap-3">
        <input name="name" required placeholder="Group home name" className="px-4 py-3 border border-line text-sm" />
        <input name="address" placeholder="Address (optional)" className="px-4 py-3 border border-line text-sm" />
        <button className="px-4 py-3 bg-teal text-white text-sm">Add group home</button>
      </form>
    </div>
  );
}
