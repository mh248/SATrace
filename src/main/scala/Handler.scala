package web

/*
   https://github.com/json4s/json4s
 */

import org.json4s._
import org.json4s.JsonDSL._
import org.json4s.jackson.JsonMethods._

class Handler {
  var sat4j: Sat4j = _

  /* https://stackoverflow.com/questions/23348480/json4s-convert-type-to-jvalue */
  def encodeJson(src: AnyRef): JValue = {
    import org.json4s.{ Extraction, NoTypeHints }
    import org.json4s.JsonDSL.WithDouble._
    import org.json4s.jackson.Serialization
    implicit val formats = Serialization.formats(NoTypeHints)
    Extraction.decompose(src)
  }
 
  def handler(command: String, params: Map[String,Seq[String]]): JValue = command match {
    case "solve" => {
      params.get("clauses") match {
        case Some(Seq(clauses)) => {
          var string2Int: Map[String, Int] = Map.empty
          var int2String: Map[Int, String] = Map.empty
          var counter = 1
          var clauseSeq: Seq[Seq[String]] = Seq.empty
          var cl: Seq[String] = Seq.empty
          for (c <- clauses.trim.split("\n")) {
            cl = c.trim.split("\\s+").toSeq
            if (!cl.isEmpty) {
              clauseSeq = clauseSeq :+ cl
              val switch = cl.map(_.replaceAll("-", "")).distinct
              for (string <- switch) {
                if (!string2Int.contains(string)) {
                  string2Int = string2Int.updated(string, counter)
                  int2String = int2String.updated(counter, string)
                  counter += 1
                }
              }
            }
          }
          int2String = int2String.updated(0, "conflict")
          sat4j = new Sat4j(timeout = 10000, int2String)
          var switchClause: Seq[Int] = Seq.empty
          for (c <- clauseSeq; if (!c.isEmpty)) {
            for (cc <- c) {
              if (cc.startsWith("-")) switchClause = switchClause :+ string2Int(cc.tail)*(-1)
              else switchClause = switchClause :+ string2Int(cc)
            }
            sat4j.addClause(switchClause)
            println(switchClause)
            switchClause = Seq.empty
          } 
          val (sat,set) = sat4j.solve()
          val traceLength = sat4j.trace.size
          val map = Map("output" -> sat, "traceLength" -> traceLength)
          println(map)
          encodeJson(map)
        }
        case _ => {
          JNull
        }
      }
    }
    case "getTrace" => {
      params.get("i") match {
        case Some(Seq(i)) => {
          val trace: Map[String,String] = sat4j.trace.getTrace(i.toInt)
          println(trace)
          encodeJson(trace)
        }
        case _ => {
          JNull
        }
      }
    }
    case _ => {
      JNull
    }
  }

  def exec(command: String, params: Map[String,Seq[String]]): Option[String] = {
    println(s"Command.exec: $command, $params")
    val result: JValue = handler(command, params)
    if (result == JNull) {
      None
    } else {
      val json = 
        ("command" -> command) ~
        ("params" -> params) ~
        ("result" -> result)
      Some(compact(render(json)))
    }
  }
}

