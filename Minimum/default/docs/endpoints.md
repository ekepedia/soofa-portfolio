
This will be populated with endpoints tomorrow

# Authentication

### Check If Password Has Been Set

**POST** /vx.x/auth/has_password
```javascript
{
    email: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        user:       Object,
        registered: Boolean
    }
}
```

Notable Error Codes: [E4003](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4003-user-not-found)

### Sign Up
**POST** /vx.x/auth/signup
```javascript
{
    email:    String,
    password: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        user: Object,
        token: String
    }
}
```

Notable Error Codes: [E4003](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4003-user-not-found), [E4102](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4102-403-duplicate-sign-up-attempt)

### Login
**POST** /vx.x/auth/login
```javascript
{
    email:    String,
    password: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        user: Object,
        token: Object
    }
}
```

Notable Error Codes: [E4003](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4003-user-not-found), [E4103](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4103-403-wrong-password), [E4005](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4005-404-user-password-not-set)

### Check If Token Is Valid
**POST** /vx.x/auth/valid_token
```javascript
{
    token: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        valid: Boolean,
        user:  user
    }
}
```
Notable Error Codes: [E4003](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4003-user-not-found), [E4104](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4104-400-invalid-token-payload), [E4105](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-API-Error-Codes#e4105-400-token-expired)

# Users

**POST** /vx.x/auth/valid_token
```javascript
{
    token: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        valid: Boolean,
        user:  user
    }
}
```

# Messages

### Get All Messages Between Two Entities

**GET** /vx.x/messages/?recipient_id=String&sender_id=String

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        conversation: {
            $message1: Message Object
        }
    }
}
```
See [Message Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#messages-1)

### Get All Messages From Any Entity

**GET** /vx.x/messages/?recipient_id=String

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        conversations: {
            $user1: {
                $message1: Message Object,
                . . .
            }
            . . .
        }
    }
}
```
See [Message Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#messages-1)

### Get One Message

**GET** /vx.x/messages/:message_id

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        message: Message Object
    }
}
```
See [Message Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#messages-1)

### Watch Message

**PATCH** /vx.x/messages/:message_id/watched
```javascript
{
   user_id: {
       origin: String        // minimum-ios, minimum-macos
       time:   Date
    }
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

# Groups

### Create Group

**POST** /vx.x/groups
```javascript
{
   name:      String,
   photo_url: String,
   group_id:  String,     // Optional: If provided, should be unique UUID
   members:   [String]    // Optional: Array of user ids
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Edit Group

**PATCH** /vx.x/groups/:group_id
```javascript
{
   name:      String,
   photo_url: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Delete Group

**DELETE** /vx.x/groups/:group_id

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Get Group

**GET** /vx.x/groups/:group_id

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    group: {
       group_metadata: Group Object,
       group_members: {
            $user_id: User Object,
            . . .
       },
       group_admins: {
            $user_id: User Object,
            . . .
       }
    }
}
```
See [User Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#user), [Group Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#groups-1),

### Add Group Member

**POST** /vx.x/groups/:group_id/members
```javascript
{
   user_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Add Group Admin

**POST** /vx.x/groups/:group_id/admins
```javascript
{
   user_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Remove Group Member

**DELETE** /vx.x/groups/:group_id/members
```javascript
{
   user_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Get A User's Groups

**GET** /vx.x/groups/:group_id?user_id=String

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    groups: [
       {
           group_metadata: Group Object,
           group_members: {
               $user_id: User Object,
               . . .
           },
           group_admins: {
               $user_id: User Object,
               . . .
           }
       }
    ]
}
```
See [User Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#user), [Group Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#groups-1),

# Contacts

### Add Contact

**PATCH** /vx.x/contacts/:user_id
```javascript
{
   contact_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Remove Contact

**DELETE** /vx.x/contacts/:user_id
```javascript
{
   contact_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Get Contacts

**GET** /vx.x/contacts/:user_id

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        contacts: {
            $user_id: User Object,
            . . .
        }
    }
}
```
See [User Object](https://github.com/maximum-ai/minimum-node-api/wiki/Minimum-Data-Models#user)


# Tokens

### Add Token

**POST** /vx.x/tokens/:user_id
```javascript
{
   service:     String,    // apns, slack, etc.
   environment: String,    // production or development
   token:       String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Remove Token

**DELETE** /vx.x/tokens/:user_id
```javascript
{
   service:     String,    // apns, slack, etc.
   environment: String,    // production or development
   token:       String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Get Tokens

**GET** /vx.x/tokens/:user_id?service=String&environment=String

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    },
    data: {
        tokens: [String]
    }
}
```

# Notifications

### New User Active

**POST** /vx.x/notifications/new-user-active
```javascript
{
    user_id:    String,
    company_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### New Group Member

**POST** /vx.x/notifications/new-group-member
```javascript
{
    user_id:  String,
    group_id: String,
    admin_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Group Photo Change

**POST** /vx.x/notifications/group-photo-change
```javascript
{
    user_id:  String,
    group_id: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```

### Group Name Change

**POST** /vx.x/notifications/group-name-change
```javascript
{
    user_id:  String,
    group_id: String,
    old_name: String
{
```

Returns
```javascript
{
    success:    Boolean,
    error: {
        message: String,
        code:    String
    }
}
```