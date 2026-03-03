import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Persistent State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type UserProfile = {
    name : Text;
  };

  type Account = {
    id : Text;
    serviceName : Text;
    username : Text;
    password : Text;
    notes : Text;
  };

  type Document = {
    id : Text;
    description : Text;
    blobId : Text;
    fileType : Text;
    fileSize : Nat;
    createdAt : Time.Time;
  };

  // Storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accountsMap = Map.empty<Principal, Map.Map<Text, Account>>();
  let documentsMap = Map.empty<Principal, Map.Map<Text, Document>>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Account Management
  public shared ({ caller }) func createAccount(serviceName : Text, username : Text, password : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Account creation requires user privileges");
    };

    let account : Account = {
      id = serviceName;
      serviceName;
      username;
      password;
      notes;
    };

    let userAccounts = switch (accountsMap.get(caller)) {
      case (null) {
        let newUserAccounts = Map.empty<Text, Account>();
        newUserAccounts.add(serviceName, account);
        newUserAccounts;
      };
      case (?existingAccounts) {
        existingAccounts.add(serviceName, account);
        existingAccounts;
      };
    };

    accountsMap.add(caller, userAccounts);
    serviceName;
  };

  public query ({ caller }) func getAccount(id : Text) : async Account {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Account retrieval requires user privileges");
    };
    switch (accountsMap.get(caller)) {
      case (?userAccounts) {
        switch (userAccounts.get(id)) {
          case (?account) { account };
          case (null) { Runtime.trap("Account not found") };
        };
      };
      case (null) { Runtime.trap("No accounts found for caller") };
    };
  };

  public shared ({ caller }) func updateAccount(id : Text, serviceName : Text, username : Text, password : Text, notes : Text) : async Account {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Account update requires user privileges");
    };

    let updatedAccount : Account = {
      id;
      serviceName;
      username;
      password;
      notes;
    };

    switch (accountsMap.get(caller)) {
      case (?userAccounts) {
        if (not userAccounts.containsKey(id)) {
          Runtime.trap("Account not found");
        };
        userAccounts.add(id, updatedAccount);
      };
      case (null) { Runtime.trap("No accounts found for caller") };
    };
    updatedAccount;
  };

  public shared ({ caller }) func deleteAccount(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Account deletion requires user privileges");
    };

    switch (accountsMap.get(caller)) {
      case (?userAccounts) {
        if (not userAccounts.containsKey(id)) {
          Runtime.trap("Account not found");
        };
        userAccounts.remove(id);
      };
      case (null) { Runtime.trap("No accounts found for caller") };
    };
  };

  public query ({ caller }) func getAllAccounts() : async [Account] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Account retrieval requires user privileges");
    };

    switch (accountsMap.get(caller)) {
      case (?userAccounts) { userAccounts.values().toArray() };
      case (null) { [] };
    };
  };

  // Document Management
  public shared ({ caller }) func createDocument(description : Text, blobId : Text, fileType : Text, fileSize : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Document creation requires user privileges");
    };

    let document : Document = {
      id = blobId;
      description;
      blobId;
      fileType;
      fileSize;
      createdAt = Time.now();
    };

    let userDocuments = switch (documentsMap.get(caller)) {
      case (null) {
        let newUserDocuments = Map.empty<Text, Document>();
        newUserDocuments.add(blobId, document);
        newUserDocuments;
      };
      case (?existingDocuments) {
        existingDocuments.add(blobId, document);
        existingDocuments;
      };
    };

    documentsMap.add(caller, userDocuments);
    blobId;
  };

  public query ({ caller }) func getDocument(id : Text) : async Document {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Document retrieval requires user privileges");
    };

    switch (documentsMap.get(caller)) {
      case (?userDocuments) {
        switch (userDocuments.get(id)) {
          case (?document) { document };
          case (null) { Runtime.trap("Document not found") };
        };
      };
      case (null) { Runtime.trap("No documents found for caller") };
    };
  };

  public shared ({ caller }) func deleteDocument(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Document deletion requires user privileges");
    };

    switch (documentsMap.get(caller)) {
      case (?userDocuments) {
        if (not userDocuments.containsKey(id)) {
          Runtime.trap("Document not found");
        };
        userDocuments.remove(id);
      };
      case (null) { Runtime.trap("No documents found for caller") };
    };
  };

  public query ({ caller }) func getAllDocuments() : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Document retrieval requires user privileges");
    };

    switch (documentsMap.get(caller)) {
      case (?userDocuments) { userDocuments.values().toArray() };
      case (null) { [] };
    };
  };
};
