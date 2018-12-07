if [ -z ${FIELDDB_HOME} ];
  then
  echo "Not using the most recent FieldDB, some functions might not work.";
else
  echo "Updating FieldDB in $FIELDDB_HOME/FieldDB/fielddb.js";
  cd $FIELDDB_HOME;
  git clone https://github.com/FieldDB/FieldDB.git;
  cd $FIELDDB_HOME/FieldDB;
  pwd;
  git remote add upstream https://github.com/FieldDB/FieldDB.git;
  git checkout master;
  git pull upstream master;
  npm install;
fi
