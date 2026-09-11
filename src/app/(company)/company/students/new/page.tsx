import { createStudent } from "../../actions";

export default function NewStudent() {
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="serif text-xl text-ink mb-2">Add a staff member</h1>
      <p className="text-sm text-slate mb-6">
        They'll start with the first course unlocked; completing it unlocks the next.
      </p>
      <form action={createStudent} className="flex flex-col gap-3">
        <input name="name" required placeholder="Full name" className="px-4 py-3 border border-line text-sm" />
        <input name="email" type="email" required placeholder="Email" className="px-4 py-3 border border-line text-sm" />
        <input
          name="tempPassword"
          required
          placeholder="Temporary password"
          className="px-4 py-3 border border-line text-sm"
        />
        <button className="px-4 py-3 bg-teal text-white text-sm">Add staff member</button>
      </form>
    </div>
  );
}
