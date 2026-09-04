// Getting a new venue to the point where it actually works.
//
// Opening an object leaves an owner in front of six buttons with no way of
// knowing which one comes first, and the order is not a matter of taste: a menu
// with no tags is a page nobody can reach, tags with no counter link produce
// calls nobody sees, and either way the thing they paid for does nothing while
// they conclude it is broken.
//
// So the panel leads with the four steps, in order, and every one of them is
// something the database can observe. A checklist with a box that never ticks
// itself is worse than no checklist — the owner is left wondering whether they
// did it wrong.
//
// Printing is the exception and is deliberately not its own step: nothing here
// can see a sheet of paper. It is what the last step requires, so it is named
// in that step's hint and linked from the one before it.

export type SetupState = {
  menuItems: number;
  points: number;
  hasStaffLink: boolean;
  requests: number;
};

export type SetupStep = {
  key: "menu" | "points" | "staff" | "first";
  title: string;
  /** What to do, or — once done — what it now means. */
  hint: string;
  /** Where the step is carried out, relative to the venue's own screens. */
  screen: string;
  done: boolean;
};

export function setupSteps(state: SetupState, words: { listTitle: string; pointsTitle: string; pointPrefix: string }): SetupStep[] {
  const point = words.pointPrefix.toLowerCase();

  return [
    {
      key: "menu",
      title: words.listTitle,
      hint:
        state.menuItems > 0
          ? `${state.menuItems} ta yozuv`
          : "Bo'limlarni va birinchi yozuvlarni qo'shing.",
      screen: "menyu",
      done: state.menuItems > 0,
    },
    {
      key: "points",
      title: words.pointsTitle,
      hint:
        state.points > 0
          ? `${state.points} ta — kodlarni chop eting va joyiga qo'ying.`
          : `Har ${point}ning o'z kodi bo'ladi. Ro'yxatni yozing.`,
      screen: "nuqtalar",
      done: state.points > 0,
    },
    {
      key: "staff",
      title: "Kassa havolasi",
      hint: state.hasStaffLink
        ? "Kassadagi telefonda ochiq tursin."
        : "Ofitsiant chaqiruvni shu havoladan ko'radi.",
      screen: "sorovlar",
      done: state.hasStaffLink,
    },
    {
      key: "first",
      title: "Birinchi chaqiruv",
      hint: state.requests > 0
        ? "Ishlayapti."
        : `Chop etilgan kodni ${point}ga qo'ying va o'zingiz bir marta bosib ko'ring.`,
      screen: "nuqtalar/chop",
      done: state.requests > 0,
    },
  ];
}

/** Once every step is done the panel has nothing left to say and goes away. */
export function isSetUp(state: SetupState): boolean {
  return setupSteps(state, { listTitle: "", pointsTitle: "", pointPrefix: "" }).every(
    (step) => step.done,
  );
}
