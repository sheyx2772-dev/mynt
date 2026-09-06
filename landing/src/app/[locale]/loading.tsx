import Mark from "@/components/Mark";

// What is on screen while a page is being fetched.
//
// Next shows this the moment a navigation starts, so it is the one place a
// visitor sees nothing else — which makes it the right place for the mark to
// do the only thing it can do. A spinner would say "something is loading" in
// the same words as every other site; the signal leaving the point says what
// this product is, at the moment there is nothing else to look at.
//
// Nothing else on it. A skeleton of a page we have not laid out yet would be a
// guess at the shape of the answer, and a wrong guess flashes twice.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Mark className="size-12" signal />
    </div>
  );
}
