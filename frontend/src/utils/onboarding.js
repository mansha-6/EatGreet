export const hasExistingRestaurantSetup = (user) => {
  if (!user || user.role !== 'admin') return false;

  // We check for these fields to see if the restaurant is actually set up
  // Just having a restaurantName (from landing page) isn't enough
  return (
    !!user.restaurantDetails?.address?.trim() &&
    !!user.restaurantDetails?.cuisineType?.trim()
  );
};

export const shouldRequireOnboarding = (user) => {
  if (!user || user.role !== 'admin') return false;

  // If the backend says they are onboarded, trust it
  if (user.isOnboarded) return false;

  // Otherwise, check if they have the mandatory info already
  return !hasExistingRestaurantSetup(user);
};
