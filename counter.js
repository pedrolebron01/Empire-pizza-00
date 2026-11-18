// Move the same pizza between containers; never clone it or grant a payment.
export function storePizza(hand, shelf, index) {
  if (!Number.isInteger(index) || index < 0 || index >= hand.length) return false;
  const pizza = hand[index];
  if (!['dough', 'raw', 'ready'].includes(pizza.stage) || shelf.includes(pizza)) return false;
  hand.splice(index, 1);
  shelf.push(pizza);
  return true;
}

export function takePizza(shelf, hand, index, capacity) {
  if (hand.length >= capacity || !Number.isInteger(index) || index < 0 || index >= shelf.length) return false;
  const pizza = shelf[index];
  if (hand.includes(pizza)) return false;
  shelf.splice(index, 1);
  hand.push(pizza);
  return true;
}

export function findReadyPizza(pizzas, recipe) {
  return pizzas.find(pizza => pizza.stage === 'ready' && pizza.recipe === recipe);
}
