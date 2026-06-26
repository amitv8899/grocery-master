export const RECIPE_IMPORT_TEMPLATE = JSON.stringify(
  [
    {
      name: "Recipe Name",
      ingredients: [
        { name: "Milk", count: 2, priority: "normal", label: "Dairy" },
        { name: "Eggs", count: 6, priority: "normal", label: null }
      ]
    },
    {
      name: "Another Recipe",
      ingredients: [
        { name: "Bread", count: 1, priority: "high", label: "Bakery" },
        { name: "Butter", count: 1, priority: "low", label: "Dairy" }
      ]
    }
  ],
  null,
  2
)
