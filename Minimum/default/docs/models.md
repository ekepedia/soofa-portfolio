# Models Documentation

This document outlines the architecture of Model's used in our API. The following variables are used to refer to a generic id:


`$message[#]`: The unique id of a message

`$group[#]`: The unique id of a group

`$user[#]`: The unique id of a user

`$token[#]`: The unique id of a token

Note: [#] means any number

All Model names are declared in `CamelCase` and field names are separated with an underscore, `like_this`

## Users

These models are associated with users

#### User

```javascript
"Users": {
    $user1: {
        "username": String,
        "email": String,
        "first_name": String,
        "last_name": String,
        "phone": String,
        "company": String,
        "photo_url": String,
        "photo_thumb_url": String,
        "lat": String,
        "lng": String,
        "created_at": Date,
        "updated_at": Date,
        "online": Boolean,         // if a user is online on the app
        "activated": Boolean,      // if a user has actually signed up
    },
    . . .
}
```

#### Contacts

```javascript
"Contacts": {
    $user1: {
        $user2: true,
        $user3: true,
        . . .
    },
    . . .
}
```

#### Carousels

```javascript
"Carousels": {
    $user1: {
        $user2: true,
        $user3: true,
        . . .
    },
    . . .
}
```

#### Favorites

```javascript
"Favorites": {
    $user1: {
        $user2: true,
        $user3: true,
        . . .
    },
    . . .
}
```

#### Tokens

```javascript
"Tokens": {
    $user1: {
        apn: {
            dev: {
                $token1: true,
                . . .
            },
            prod: {
                $token2: true,
                . . .
            }
        },
        slack: String,
        linkedin: String,
        . . .
    },
    . . .
}
```

## Groups

These models are associated with groups

#### Groups

```javascript
"Groups": {
    $group1: {
        "username": String,
        "name": String,
        "company": String,
        "photo_url": String,
        "photo_thumb_url": String,
        "created_at": Date,
        "updated_at": Date,
        "description": String
    },
    . . .
}
```

#### GroupMembers

```javascript
"GroupMembers": {
    $group1: {
        $user2: true,
        $user3: true,
        . . .
    },
    . . .
}
```

#### GroupAdmins

```javascript
"GroupAdmins": {
    $group1: {
        $user2: true
    },
    . . .
}
```

#### UserGroups

```javascript
"UserGroups": {
    $user1: {
        $group1: true,
        $group2: true,
        . . .
    },
    . . .
}
```

## Messages

These models are associated with messages

#### Messages

```javascript
"Messages": {
    $message1: {
        "sender_id": String,
        "recipient_id": String,
        "status": String, // processing, done
        "cloudinary_public_id": String,
        "audio_url": String,
        "audio_processed": Boolean,
        "audio_duration": Number,
        "audio_sample_rate": Number,
        "speech_text": String,
        "audio_processing_error": Object,
        "lat": Number,
        "lng": Number,
        "sender_metadata": {
            "first_name": String,
            "last_name": String,
            "company": String,
            "photo_url": String
        },
        "recipient_notified": Boolean,
        "watched": Boolean,
        "created_at": Date,
        "updated_at": Date,
        "video_url": String,
        "origin": String,                 // minimum-ios, slack, etc.
        "keywords": [String, . . . ]
    },
    . . .
}
```

#### Conversations

```javascript
"Conversations": {
    $user1: {
        "last_message": {
            "message_id": $message3,
            "sender_id": String,
            "speech_text": String,
            "speech_text": String,
            "created_at": Date,
        },
        $user2: {
            "created_at": Date,
            "updated_at": Date,
            "messeages": [$message1, $message2, $message3, . . .]
        },
        . . .
    },
    $group1: {
        "last_message": $message50,
        "created_at": Date,
        "updated_at": Date,
        "messeages": [$message49, $message50, . . .]
    },
    . . .
}
```

#### ArchivedConversations

```javascript
"ArchivedConversations": {
    $user1: {
        $user2: {
            "created_at": Date,
            "updated_at": Date,
            "messeages": [$message0]
        },
        . . .
    }
    $group1: {
        "created_at": Date,
        "updated_at": Date,
        "messeages": [$message48, $message47, . . .]
    },
    . . .
}
```

#### Unread Messages

```javascript
"UnreadMessages": {
    $user1: {
       $message1: true,
       . . .
    }
    . . .
}
```