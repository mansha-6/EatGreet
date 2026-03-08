export const hasExistingRestaurantSetup = (user) => {
  if (!user || user.role !== 'admin') return false;

  // If the user has a restaurant name, they can access the dashboard. 
  // Other details can be filled out in Settings later.
  return !!user.restaurantName?.trim();
};

export const shouldRequireOnboarding = (user) => {
  if (!user || user.role !== 'admin') return false;
  return !user.isOnboarded && !hasExistingRestaurantSetup(user);
};
