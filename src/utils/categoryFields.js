export const CATEGORIES = [
  { value: 'tortoise', label: 'Tortoise' },
  { value: 'gecko', label: 'Gecko' },
  { value: 'snake', label: 'Snake' },
];

const CATEGORY_FIELDS = {
  tortoise: [
    { key: 'food_type', label: 'What was fed', type: 'select_other', options: ['Greens', 'Hay', 'Vegetables', 'Fruit', 'Other'] },
  ],
  gecko: [
    { key: 'food_type', label: 'What was fed', type: 'select_other', options: ['Worms', 'Roaches', 'Crickets', 'Other'] },
    { key: 'shed_date', label: 'Last shed date', type: 'date' },
  ],
  snake: [
    { key: 'food_type', label: 'What was fed', type: 'select_other', options: ['Mouse', 'Rat', 'Chick', 'Other'] },
    { key: 'shed_date', label: 'Last shed date', type: 'date' },
  ],
};

export function getCategoryFields(category) {
  return CATEGORY_FIELDS[category] || [];
}

export function getCategoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value || '';
}

const FIELD_ICONS = {
  food_type: '🍽️',
  shed_date: '🐍',
};

export function getFieldIcon(key) {
  return FIELD_ICONS[key] || '📋';
}
