export const CATEGORIES = [
  { value: 'snakes', label: 'Snakes' },
  { value: 'geckos', label: 'Geckos' },
  { value: 'tortoises', label: 'Tortoises' },
  { value: 'turtles', label: 'Turtles' },
  { value: 'bearded_dragons', label: 'Bearded Dragons' },
  { value: 'chameleons', label: 'Chameleons' },
  { value: 'iguanas', label: 'Iguanas' },
  { value: 'skinks', label: 'Skinks' },
  { value: 'other', label: 'Other' },
];

// Field types: 'date', 'select', 'select_other', 'number', 'toggle', 'text'
// select_other shows a text input when "Other" is chosen

const CATEGORY_FIELDS = {
  snakes: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Mouse', 'Rat', 'Chick', 'Other'] },
    { key: 'food_size', label: 'Food Size', type: 'select_other', options: ['Pinky', 'Fuzzy', 'Hopper', 'Adult', 'Other'] },
    { key: 'feeding_method', label: 'Feeding Method', type: 'select', options: ['Live', 'Frozen/Thawed', 'Pre-killed'] },
  ],
  geckos: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Crickets', 'Mealworms', 'Dubia Roaches', 'CGD/Fruit Mix', 'Other'] },
  ],
  tortoises: [
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Greens', 'Hay', 'Pellets', 'Mixed', 'Other'] },
    { key: 'soak_done', label: 'Soaked', type: 'toggle' },
    { key: 'soak_duration_min', label: 'Soak Duration (min)', type: 'number', placeholder: '15' },
    { key: 'shell_condition', label: 'Shell Condition', type: 'select_other', options: ['Healthy', 'Dry/Flaky', 'Pyramiding', 'Soft', 'Other'] },
  ],
  turtles: [
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Pellets', 'Shrimp', 'Fish', 'Greens', 'Mixed', 'Other'] },
    { key: 'soak_done', label: 'Soaked', type: 'toggle' },
    { key: 'soak_duration_min', label: 'Soak Duration (min)', type: 'number', placeholder: '15' },
    { key: 'shell_condition', label: 'Shell Condition', type: 'select_other', options: ['Healthy', 'Dry/Flaky', 'Pyramiding', 'Soft', 'Other'] },
    { key: 'water_temp', label: 'Water Temp (°F)', type: 'number', placeholder: '78' },
    { key: 'basking_temp', label: 'Basking Temp (°F)', type: 'number', placeholder: '90' },
  ],
  bearded_dragons: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Crickets', 'Dubia Roaches', 'Greens', 'Mixed', 'Other'] },
    { key: 'uv_index', label: 'UV Index', type: 'number', placeholder: '6' },
  ],
  chameleons: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Crickets', 'Flies', 'Hornworms', 'Other'] },
    { key: 'misting_done', label: 'Misted', type: 'toggle' },
  ],
  iguanas: [
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Greens', 'Fruit', 'Mixed', 'Other'] },
    { key: 'soak_done', label: 'Soaked', type: 'toggle' },
    { key: 'soak_duration_min', label: 'Soak Duration (min)', type: 'number', placeholder: '15' },
    { key: 'uv_index', label: 'UV Index', type: 'number', placeholder: '6' },
  ],
  skinks: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'select_other', options: ['Crickets', 'Snails', 'Greens', 'Mixed', 'Other'] },
  ],
  other: [
    { key: 'shed_date', label: 'Shed Date', type: 'date' },
    { key: 'shed_quality', label: 'Shed Quality', type: 'select', options: ['Clean', 'Partial', 'Stuck'] },
    { key: 'food_type', label: 'Food Type', type: 'text', placeholder: 'What did they eat?' },
  ],
};

export function getCategoryFields(category) {
  return CATEGORY_FIELDS[category] || CATEGORY_FIELDS.other;
}

export function getCategoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || 'Other';
}

// Display-friendly labels for field values
const FIELD_ICONS = {
  shed_date: '🐍',
  shed_quality: '✨',
  food_type: '🍽️',
  food_size: '📏',
  feeding_method: '🎯',
  soak_done: '🛁',
  soak_duration_min: '⏱️',
  shell_condition: '🛡️',
  water_temp: '🌊',
  basking_temp: '☀️',
  uv_index: '🔆',
  misting_done: '💦',
};

export function getFieldIcon(key) {
  return FIELD_ICONS[key] || '📋';
}
