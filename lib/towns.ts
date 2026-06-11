export function saveTown(
  town: string
) {
  const towns = JSON.parse(
    localStorage.getItem("mq_towns") || "[]"
  );

  if (!towns.includes(town)) {
    towns.push(town);

    localStorage.setItem(
      "mq_towns",
      JSON.stringify(towns)
    );

    return true;
  }

  return false;
}