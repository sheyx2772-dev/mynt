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
//
// The mark is bare here and large. It sat on its ink tile at first, which is
// how it is drawn everywhere else — but everywhere else it is an object ON a
// page, and here it is the only thing there is. The tile put a hard-edged
// square in the middle of an empty screen and the eye went to the edge instead
// of to the arcs, which are the part that says something is happening.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Mark className="size-24 sm:size-28" tone="bare" signal />
    </div>
  );
}
