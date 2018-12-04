if [ -z ${FIELDDB_HOME} ];
  then
  echo "Not using the most recent FieldDB, some functions might not work.";
else
  echo "Symlinking FieldDB to your local dev version";
  npm link fielddb;
fi
