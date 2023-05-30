class User {
  constructor(username, password, role, users) {
    const Role = {
      admin: "admin",
      manager: "manager",
      user: "user",
    };
    if (!username || !password || !role) {
      throw new Error("The fields username, password and role are required");
    }

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    )
      throw new Error("The fields username, password and role must be strings");

    if (role !== Role.admin && role !== Role.manager && role !== Role.user)
      throw new Error("The field role must be one of admin, manager or user");

    if (users && !Array.isArray(users))
      throw new Error(
        "The field users must be an array of strings type username"
      );

    this.username = username;
    this.password = password;
    this.role = role;
    this.users = users || [];
  }
}

module.exports = User;
