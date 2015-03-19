#!/bin/bash
function coloredEcho(){
  local exp=$1;
  local color=$2;
  if ! [[ $color =~ '^[0-9]$' ]] ; then
   case $(echo $color | tr '[:upper:]' '[:lower:]') in
    black) color=0 ;;
red) color=1 ;;
green) color=2 ;;
yellow) color=3 ;;
blue) color=4 ;;
magenta) color=5 ;;
cyan) color=6 ;;
        white|*) color=7 ;; # white or invalid color
esac
fi
tput setaf $color;
echo $exp;
tput sgr0;
}

echo "============================================================="
echo "  Running CURL tests for deprecated routes "
echo "============================================================="


TESTCOUNT=0;
TESTFAILED=0;
TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
TESTPASSED=0;
TESTCOUNTEXPECTED=27;

# Production server is using http behind nginx
SERVER="https://localhost:3183";
if [ "$NODE_DEPLOY_TARGET" == "production" ]; then
  SERVER="http://localhost:3183";
fi
# SERVER="https://authdev.lingsync.org";

echo ""
echo "Using $SERVER"

echo "-------------------------------------------------------------"
TESTNAME="It should return user details upon successful login"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme"}' \
$SERVER/login `"
echo ""
echo "Response: $result" | grep -C 4 prefs;
if [[ $result =~ userFriendlyErrors ]]
  then {
   TESTFAILED=$[TESTFAILED + 1]
   TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
 }
fi 
if [[ $result =~ "\"prefs\": " ]]
  then {
    echo "Details recieved, you can use this user object in your app settings for this user."
    echo "   success";
  } else  {
   TESTFAILED=$[TESTFAILED + 1]
   TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
 }
fi 

echo "-------------------------------------------------------------"
TESTNAME="It should count down the password reset"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme"}' \
$SERVER/login `"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "opps"}' \
$SERVER/login `"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "wrongpassword"}' \
$SERVER/login `"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "again"}' \
$SERVER/login `"
echo "$result"
if [[ $result =~ "You have 2 more attempts"  ]]
  then {
    echo "   success 2 more attempts";
  } else {
   TESTFAILED=$[TESTFAILED + 1]
   TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
 }
fi
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "trying"}' \
$SERVER/login `"
# echo "$result"
if [[ $result =~ "You have 1 more attempts"  ]]
  then {
    echo "   success 1 more attempt";
  } else {
   TESTFAILED=$[TESTFAILED + 1]
   TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
 }
fi
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "wrongpassword"}' \
$SERVER/login `"
echo "$result"
if [[ $result =~ "You have tried to log in"  ]]
  then {
    echo "   success warn user who have no email ";
  } else {
   TESTFAILED=$[TESTFAILED + 1]
   TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
 }
fi

echo "-------------------------------------------------------------"
TESTNAME="It should refuse to register existing names"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme",
"appbrand": "learnx"}' \
$SERVER/register `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "  success"
    if [[ $result =~ "Username already exists, try a different username"  ]]
      then {
        echo "   server provided an informative message";
      } else {
       TESTFAILED=$[TESTFAILED + 1]
       TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
     }
   fi
 } else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 

echo "-------------------------------------------------------------"
TESTNAME="It should refuse to register short usernames"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "ba", "password": "phoneme"}' \
$SERVER/register `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo " success"
    if [[ $result =~ "Please choose a longer username"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 

echo "-------------------------------------------------------------"
TESTNAME="It should accept changepassword"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme", "newpassword": "phoneme", "confirmpassword": "phoneme"}' \
$SERVER/changepassword `"
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "$result"
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo " success"
    echo "Response: $result" | grep -C 4 prefs;
    echo "   server provided an user details";
    echo "Response: $result" | grep -C 4 password;
    if [[ $result =~ "Your password has succesfully been updated"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to changepassword if the new password is missing"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme"}' \
$SERVER/changepassword `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "Please provide your new password"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to changepassword if the confirm password doesnt match"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme", "newpassword": "phoneme", "confirmpassword": "phonem"}' \
$SERVER/changepassword `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "New passwords do not match, please try again"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse forgotpassword if the user hasnt tried to login (ie doesnt know thier username)"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "testinguserwithemail", "password": "test"}' \
$SERVER/login `"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"email": "myemail@example.com"}' \
$SERVER/forgotpassword `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {  
  echo "   success"
  if [[ $result =~ "there are no users who have failed to login who have the email you provided"  ]]
   then {
     echo "   server provided an informative message";
   } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept forgotpassword (and fail on the last step if on a dev server since it has no credentials to send emails)"
echo "$TESTNAME"
echo " prep: try to login with wrong password"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "testinguserwithemail", "password": "opps"}' \
$SERVER/login `"
echo ""
# echo "Response: $result";
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"email": "myemail@example.com"}' \
$SERVER/forgotpassword `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {  
  echo "   success"
  if [[ $result =~ "Please report this 2823"  ]]
   then {
     echo "   server provided an informative message";
   } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to send a password reset if neither email nor username was provided"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{}' \
$SERVER/forgotpassword `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "Please provide an email"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to tell a corpusteam details if the username is not a valid user "
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "testingspreadshee",  "couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/corpusteam `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "Unauthorized, you are not a member of this corpus team"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to tell a corpusteam details if the username is a valid user but not on that team. eg: "
echo "$TESTNAME"
echo " prep: remove user if currently on the team"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingspreadsheet",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "testingspreadsheet", 
"password": "test", 
"couchConnection": {
  "pouchname": "jenkins-firstcorpus"
} }' \
$SERVER/corpusteam `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "Unauthorized, you are not a member of this corpus team"  ]]
     then {
       echo "   server provided an informative message";
     } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi
} else {
  TESTFAILED=$[TESTFAILED + 1]
  TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept corpusteam requests from the backbone app. "
echo "$TESTNAME"
echo " eg: "
echo '       {'
echo '         "username": "jenkins",'
echo '         "password": "phoneme",'
echo '         "couchConnection": {'
echo '           "pouchname": "jenkins-firstcorpus"'
echo '         }'
echo '       }'
echo ""
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"couchConnection": 
{"pouchname": 
"jenkins-firstcorpus"} }' \
$SERVER/corpusteam `"
echo ""
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "Response: $result";
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    if [[ $result =~ readers ]]
      then {
        echo "Response: $result" | grep -C 4 readers;
        echo "   server replied with team details to a prototype-like request."
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept corpusteam requests from the spreadsheet app. "
echo "$TESTNAME"
echo " eg: "
echo '      {'
echo '        "username": "jenkins",'
echo '        "password": "phoneme",'
echo '        "serverCode": "localhost",'
echo '        "pouchname": "jenkins-firstcorpus"'
echo '      }'
echo ""
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"serverCode": "localhost", 
"pouchname": "jenkins-firstcorpus"}' \
$SERVER/corpusteam `"
echo ""
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "Response: $result";
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    if [[ $result =~ readers ]]
      then {
        echo "Response: $result" | grep -C 4 readers;
        echo "   server replied with team details to a spreadsheet-like request"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to addroletouser if the user doesnt authenticate at the same time"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins"}' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "user credentials must be reqested from the user prior to running this request" ]]
      then {
        echo "   server replied an informative message"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to addroletouser if the corpus is missing"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins",
"password": "phoneme" }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "the corpus to be modified must be included in the request" ]]
      then {
        echo "   server replied with an informative message"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 

echo "-------------------------------------------------------------"
TESTNAME="It should refuse to addroletouser if the user(s) to modify are missing"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"couchConnection": {
  "pouchname":
  "jenkins-firstcorpus"
} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "user(s) to modify must be included in this request" ]]
      then {
        echo "   server replied with an informative message"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to addroletouser if the roles to add and/or remove are missing"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingprototype"
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "roles to add or remove" ]]
      then {
        echo "   server replied with an informative message"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should be able to remove all roles from a user"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingprototype",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "was removed from" ]]
      then {
        echo "   server replied with an informative message"

        echo "   Checking if corpus was removed from the user"
        result="`curl -kX POST \
        -H "Content-Type: application/json" \
        -d '{"username": "testingprototype", "password": "test"}' \
        $SERVER/login `"
        echo "Response: $result" | grep -C 4 pouchname;
        if [[ $result =~ "\"pouchname\": \"jenkins-firstcorpus\"" ]]
          then {
            TESTFAILED=$[TESTFAILED + 1]
            TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
          } else {
            echo "    sever made sure the corpus was removed in the user too"
          }
        fi 

      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should be able to add and remove roles in the same request"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingprototype",
  "add": ["reader", "commenter"],
  "remove": ["admin", "writer"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "has reader commenter access" ]]
      then {
        echo "   sever replied with updated role information"

        echo "   Checking if corpus was added to the user"
        result="`curl -kX POST \
        -H "Content-Type: application/json" \
        -d '{"username": "testingprototype", 
        "password": "test"}' \
        $SERVER/login `"
        echo "Response: $result" | grep -C 2 "jenkins-firstcorpus";
        if [[ $result =~ "\"pouchname\": \"jenkins-firstcorpus\"" ]]
          then {
            echo "    sever made sure the corpus was listed in this user too"
          } else {
            TESTFAILED=$[TESTFAILED + 1]
            TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
          }
        fi 

      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse to add non-existant users to the corpus"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "userdoesntexist",
  "add": ["reader", "commenter"],
  "remove": ["admin", "writer"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"

    if [[ $result =~ "username was unrecognized" ]]
      then {
        echo "   server provided an informative message"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 

sleep 1

echo "-------------------------------------------------------------"
TESTNAME="It should accept roles to add and remove from one or or more users "
echo "$TESTNAME"
echo " prep: remove first user"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingprototype",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo " prep: remove other user"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingspreadsheet",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo '{' 
echo '  "username": "jenkins",' 
echo '  "password": "phoneme",' 
echo '  "couchConnection": {' 
echo '    "pouchname": "jenkins-firstcorpus"' 
echo '  },' 
echo '  "users": [{' 
echo '    "username": "testingspreadsheet",' 
echo '    "add": [' 
echo '      "reader",' 
echo '      "exporter"'
echo '    ],' 
echo '    "remove": [' 
echo '      "admin",' 
echo '      "writer"' 
echo '    ]' 
echo '  }, {' 
echo '    "username": "testingprototype",' 
echo '    "add": [' 
echo '      "writer"'
echo '    ]' 
echo '  }]' 
echo '}' 
echo ''
echo ""
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingspreadsheet",
  "add": ["reader", "exporter"],
  "remove": ["admin", "writer"]
},{
  "username": "testingprototype",
  "add": ["writer"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "has reader exporter access" ]]
      then {
        echo "   sever replied with updated role information"

        echo " Checking if corpus was added to the first user"
        result="`curl -kX POST \
        -H "Content-Type: application/json" \
        -d '{"username": "testingspreadsheet", 
        "password": "test"}' \
        $SERVER/login `"
        echo "Response: $result" | grep -C 2 "jenkins-firstcorpus";
        if [[ $result =~ "\"pouchname\": \"jenkins-firstcorpus\"" ]]
          then {
            echo "    sever added corpus to the first user too"
            echo " Checking if corpus was added to the second user"
            result="`curl -kX POST \
            -H "Content-Type: application/json" \
            -d '{"username": "testingprototype", 
            "password": "test"}' \
            $SERVER/login `"
            echo "Response: $result" | grep -C 2 "jenkins-firstcorpus";
            if [[ $result =~ "\"pouchname\": \"jenkins-firstcorpus\"" ]]
              then {
                echo "    sever added corpus to the second user too"
              } else {
                TESTFAILED=$[TESTFAILED + 1]
                TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
              }
            fi 
          } else {
            TESTFAILED=$[TESTFAILED + 1]
            TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
          }
        fi 

      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept addroletouser from the backbone app. eg: "
echo "$TESTNAME"
echo '   {'
echo '      "username": "jenkins",'
echo '      "password": "phoneme",'
echo '      "userToAddToRole": "testingprototype",'
echo '      "roles": ["reader", "commenter"],'
echo '      "couchConnection": {'
echo '        "pouchname": "jenkins-firstcorpus"'
echo '      }'
echo '    }'
echo " prep: remove the user"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingprototype",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"userToAddToRole": "testingprototype", 
"roles": ["reader","commenter"], 
"couchConnection": {
  "pouchname": "jenkins-firstcorpus"
} }' \
$SERVER/addroletouser `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "testingprototype now has reader commenter access to jenkins-firstcorpus" ]]
      then {
        echo "Response: $result" | grep -C 4 readers;
        echo "    server replied with informative info"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should refuse newcorpus if the title is not specified"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme"}' \
$SERVER/newcorpus `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    echo "   success"
    if [[ $result =~ "missing: newCorpusName" ]]
      then {
        echo "Response: $result" | grep -C 4 readers;
        echo "    server replied with informative info"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  } else {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should not complain if users tries to recreate a newcorpus"
echo "$TESTNAME"
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"newCorpusName": "My new corpus title"}' \
$SERVER/newcorpus `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
   echo "   success"
 } else {
  if [[ $result =~ "already exists, no need to create it" ]]
    then {
      echo "Response: $result" | grep -C 2 my_new_corpus_title;
      echo "    server replied with a 302 status saying it existed."
    } else {
      TESTFAILED=$[TESTFAILED + 1]
      TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
    }
  fi 
}
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept deprecated updateroles from the spreadsheet app  eg: "
echo "$TESTNAME"
echo '    {'
echo '      "username": "jenkins",'
echo '      "password": "phoneme",'
echo '      "serverCode": "localhost",'
echo '      "userRoleInfo": {'
echo '        "usernameToModify": "testingspreadsheet",'
echo '        "pouchname": "jenkins-firstcorpus",'
echo '        "admin": false,'
echo '        "writer": true,'
echo '        "reader": true,'
echo '        "commenter": true'
echo '      }'
echo '     }'
# echo 'file://angular_client/modules/spreadsheet/app/scripts/controllers/SpreadsheetController.js '
# echo '      dataToPost.userRoleInfo = {};'
# echo '      dataToPost.userRoleInfo.usernameToModify = userid;'
# echo '      dataToPost.userRoleInfo.pouchname = $rootScope.corpus.pouchname;'
# echo '      //dataToPost.userRoleInfo.removeUser = true;'
# echo '      switch (newUserRoles.role) {'
# # echo '      /*'
# # echo '            NOTE THESE ROLES are not accurate reflections of the db roles,'
# # echo '            they are a simplification which assumes the'
# # echo '            admin -> writer -> commenter -> reader type of system.'
# # echo ''
# # echo '            Infact some users (technical support or project coordinators) might be only admin,'
# # echo '            and some experiment participants might be only writers and'
# # echo '            cant see each others data.'
# # echo ''
# # echo '            Probably the clients wanted the spreadsheet roles to appear implicative since its more common.'
# # echo '            see https://github.com/OpenSourceFieldlinguistics/FieldDB/issues/1113'
# # echo '          */'
# # echo '      case "admin":'
# # echo '        newUserRoles.admin = true;'
# # echo '        newUserRoles.reader = true;'
# # echo '        newUserRoles.commenter = true;'
# # echo '        newUserRoles.writer = true;'
# # echo '        rolesString += " Admin";'
# # echo '        break;'
# # echo '      case "read_write":'
# # echo '        newUserRoles.admin = false;'
# # echo '        newUserRoles.reader = true;'
# # echo '        newUserRoles.commenter = true;'
# # echo '        newUserRoles.writer = true;'
# # echo '        rolesString += " Writer Reader";'
# # echo '        break;'
# # echo '      case "read_only":'
# # echo '        newUserRoles.admin = false;'
# # echo '        newUserRoles.reader = true;'
# # echo '        newUserRoles.commenter = false;'
# # echo '        newUserRoles.writer = false;'
# # echo '        rolesString += " Reader";'
# # echo '        break;'
# # echo '      case "read_comment_only":'
# # echo '        newUserRoles.admin = false;'
# # echo '        newUserRoles.reader = true;'
# # echo '        newUserRoles.commenter = true;'
# # echo '        newUserRoles.writer = false;'
# # echo '        rolesString += " Reader Commenter";'
# # echo '        break;'
# # echo '      case "write_only":'
# echo '        newUserRoles.admin = false;'
# echo '        newUserRoles.reader = false;'
# echo '        newUserRoles.commenter = true;'
# echo '        newUserRoles.writer = true;'
# echo '        rolesString += " Writer";'
# # echo '        break;'
# # echo '    }'
# echo ''
# echo '    newUserRoles.pouchname = $rootScope.corpus.pouchname;'
# echo ''
# echo '    var dataToPost = {};'
# echo '    dataToPost.username = $rootScope.user.username.trim();'
# echo '    dataToPost.password = $rootScope.loginInfo.password.trim();'
# echo '    dataToPost.serverCode = $rootScope.serverCode;'
# echo '    dataToPost.authUrl = Servers.getServiceUrl($rootScope.serverCode, "auth");'
# echo ''
# echo '    dataToPost.userRoleInfo = newUserRoles;'
# echo '    '
TESTCOUNT=$[TESTCOUNT + 1]
echo " prep: remove the user"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingspreadsheet",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"serverCode": "localhost", 
"userRoleInfo": {
  "usernameToModify": "testingspreadsheet", 
  "pouchname": "jenkins-firstcorpus", 
  "admin": false, 
  "writer": true, 
  "reader": true, 
  "commenter": true 
}}' \
$SERVER/updateroles `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "now has writer reader commenter access" ]]
      then {
        echo "Response: $result" | grep -C 3 after;
        echo "    server replied with informative info"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo "-------------------------------------------------------------"
TESTNAME="It should accept new updateroles (from the spreadsheet app)"
echo "$TESTNAME"
echo '     {'
echo '      "username": "jenkins",'
echo '      "password": "phoneme",'
echo '      "serverCode": "localhost",'
echo '      "pouchname": "jenkins-firstcorpus",'
echo '      "users": [{'
echo '        "username": "testingspreadsheet",'
echo '        "add": ["writer", "commenter", "reader"],'
echo '        "remove": ["admin"]'
echo '      }]'
echo '     }'
echo " prep: remove the user"
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", "password": "phoneme",
"users": [{
  "username": "testingspreadsheet",
  "remove": ["all"]
}],
"couchConnection": {"pouchname": "jenkins-firstcorpus"} }' \
$SERVER/addroletouser `"
echo '    '
TESTCOUNT=$[TESTCOUNT + 1]
result="`curl -kX POST \
-H "Content-Type: application/json" \
-d '{"username": "jenkins", 
"password": "phoneme", 
"serverCode": "localhost", 
"pouchname": "jenkins-firstcorpus", 
"users": [{
  "username": "testingspreadsheet", 
  "add":["writer","commenter","reader"], 
  "remove": ["admin"]
} ] }' \
$SERVER/updateroles `"
echo ""
echo "Response: $result";
if [[ $result =~ userFriendlyErrors ]]
  then {
    TESTFAILED=$[TESTFAILED + 1]
    TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
  } else {
    echo "   success"
    if [[ $result =~ "testingspreadsheet now has writer commenter reader access" ]]
      then {
        echo "Response: $result" | grep -C 3 after;
        echo "    server replied with informative info"
      } else {
        TESTFAILED=$[TESTFAILED + 1]
        TESTSFAILEDSTRING="$TESTSFAILEDSTRING : $TESTNAME"
      }
    fi 
  }
fi 


echo;
echo;
echo "============================================================="
echo "Test results for deprecated routes";

TESTPASSED=$((TESTCOUNT-TESTFAILED));
if [ $TESTPASSED = $TESTCOUNT ]; then
 coloredEcho  "   $TESTPASSED passed of $TESTCOUNT" green
else
  coloredEcho  "   $TESTPASSED passed of $TESTCOUNT" red
  coloredEcho  "    $TESTFAILED failed" red
  coloredEcho "    $TESTSFAILEDSTRING" red
fi

if [ $TESTCOUNT = $TESTCOUNTEXPECTED ]; then
 coloredEcho  "   Ran $TESTCOUNT of $TESTCOUNTEXPECTED expected" green
else
  coloredEcho  "   Ran $TESTCOUNT of $TESTCOUNTEXPECTED expected" yellow
fi

echo "============================================================="

if [ $TESTPASSED -eq $TESTCOUNT ]
  then 
  exit $TESTFAILED;
else
  exit $TESTFAILED;
fi
# ls noqata_tusunayawami.mp3 || {
# 	result="`curl -O --retry 999 --retry-max-time 0 -C - https://github.com/OpenSourceFieldlinguistics/FieldDB/blob/master/sample_data/noqata_tusunayawami.mp3?raw=true
# 	mv "noqata_tusunayawami.mp3?raw=true" noqata_tusunayawami.mp3
# }

# 15602
