name := "SATracer"
version := "1.0"
scalaVersion := "2.12.14"

libraryDependencies += "javax.servlet" % "javax.servlet-api" % "3.0.1" % "provided"
libraryDependencies += "org.json4s" %% "json4s-jackson" % "4.0.0"

// enablePlugins(JettyPlugin)
enablePlugins(TomcatPlugin)

enablePlugins(HerokuDeploy)
herokuAppName := "salty-river-97107"