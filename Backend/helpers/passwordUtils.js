export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 number, 1 special character
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
};

export const generateValidPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const special = "@$!%*?&";
  
  let password = "";
  // Ensure at least one of each required type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += nums[Math.floor(Math.random() * nums.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest to ensure minimum length of 8 (we add 5 more characters)
  const allChars = upper + lower + nums + special;
  for(let i = 0; i < 5; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the characters so the required ones aren't always at the beginning
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};
