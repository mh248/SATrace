package web

import org.sat4j.minisat.SolverFactory
import org.sat4j.specs.ISolver
import org.sat4j.specs.ISolverService
import org.sat4j.specs.IConstr
import org.sat4j.specs.Constr
import org.sat4j.specs.Lbool
import org.sat4j.specs.SearchListener
import org.sat4j.specs.RandomAccessModel
import org.sat4j.specs.TimeoutException
import org.sat4j.specs.ContradictionException
import org.sat4j.core.VecInt
import scala.collection.BitSet

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

class MiniSat[D <: org.sat4j.minisat.core.DataStructureFactory](
  learning: org.sat4j.minisat.core.LearningStrategy[D],
  dsf: D,
  order: org.sat4j.minisat.core.IOrder,
  restart: org.sat4j.minisat.core.RestartStrategy
) extends org.sat4j.minisat.core.Solver[D](learning, dsf, order, restart) {
  // Set of original constraints
  def getConstrs: org.sat4j.specs.IVec[Constr] = constrs
  // def getIthConstr(i: Int)
  // def getLearnedConstraints
  // variable assignments (literals) in chronological order
  def getTrail: org.sat4j.specs.IVecInt = trail
  // position of the decision levels on the trail
  def getTrailLim: org.sat4j.specs.IVecInt = trailLim
  // position of assumptions before starting the search
  def getRootLevel: Int = rootLevel
  // getLevel
  def getLevel(p: Int): Int = getVocabulary.getLevel(p)
  // getReason
  def getReason(p: Int): Constr = getVocabulary.getReason(p)
}

object MiniSat {
  import org.sat4j.minisat.constraints.{MixedDataStructureDanielWL => D}
  def apply() = {
    val dsf = new D()
    val learning = new org.sat4j.minisat.learning.MiniSATLearning[D]()
    val order = new org.sat4j.minisat.orders.VarOrderHeap()
    val restart = new org.sat4j.minisat.restarts.MiniSATRestarts()
    new MiniSat(learning, dsf, order, restart)
  }
}

class Sat4j(timeout: Int, int2String: Map[Int, String]) extends SearchListener[ISolverService] {
  val sat4jSolver: ISolver = MiniSat()
  val bcEncoder = new org.sat4j.tools.encoding.Sequential()
  var trace = new Trace(int2String)

  def addClause(clause: Seq[Int]): Unit = {
    sat4jSolver.addClause(new VecInt(clause.toArray))
  }
  def addAtMost(lits: Seq[Int], degree: Int): Unit = {
    bcEncoder.addAtMost(sat4jSolver, new VecInt(lits.toArray), degree)
  }
  def addAtLeast(lits: Seq[Int], degree: Int): Unit = {
    bcEncoder.addAtLeast(sat4jSolver, new VecInt(lits.toArray), degree)
  }
  def addExactly(lits: Seq[Int], degree: Int): Unit = {
    bcEncoder.addExactly(sat4jSolver, new VecInt(lits.toArray), degree)
  }

  def log(s: String): Unit = {
    print("# ")
    println(s)
  }

  def toDimacs(p: Int): Int = org.sat4j.core.LiteralsUtils.toDimacs(p)
  def toDimacs(clause: IConstr): Seq[Int] = {
    if (clause == null) Seq.empty
    else clause.toString.trim.replaceAll("\\[.\\]", "").split(" ").map(_.toInt)
  }
  def trailData(lit: Int, level: Int, reason: IConstr) = {
    val learnt= if (reason == null) false else reason.learnt()
    TrailData(lit, level, toDimacs(reason), learnt)
  }

  def getCurrentTrail(): Seq[TrailData] = {
    var tr: Seq[TrailData] = Seq.empty
    sat4jSolver match {
      case minisat: MiniSat[_] => {
        val trail = minisat.getTrail
        val trailLim = minisat.getTrailLim
        var i = 0
        for (level <- 0 to trailLim.size) {
          while (i < trail.size && (level == trailLim.size || i < trailLim.get(level))) {
            val p: Int = trail.get(i)
            val reason: Constr = minisat.getReason(p)
            tr :+= trailData(toDimacs(p), level, reason)
            i += 1
          }
        }
      }
    }
    tr
  }

  /*
   * Listeners
   */
  // Provide access to the solver's controllable interface
  def init(solverService: ISolverService): Unit = {
    log("init")
  }
  // decision variable
  def assuming(lit: Int): Unit = {
    log(s"assuming: $lit")
    val trail = getCurrentTrail()
    val level = if (trail.size == 0) 1 else trail.map(_.level).max + 1
    trace.addTrace(s"Assume $lit", trail :+ trailData(lit, level, null))
  }
  // Unit propagation
  def propagating(lit: Int, reason: IConstr): Unit = {
    log(s"propagating: $lit, $reason")
  }
  // backtrack on a decision variable
  def backtracking(lit: Int): Unit = {
    log(s"backtracking: $lit")
    trace.addTrace(s"Undo $lit")
  }
  // adding forced variable (conflict driven assignment)
  def adding(lit: Int): Unit = {
    log(s"adding: $lit")
  }
  // learning a new clause
  def learn(clause: IConstr): Unit = {
    log(s"learn: $clause")
    sat4jSolver match {
      case minisat: MiniSat[_] => {
        val learned = minisat.getLearnedConstraints
        for (i <- 0 until learned.size) {
          val c = learned.get(i)
          log(s"  learned($i) = $c")
        }
      }
    }
    val learn = toDimacs(clause).mkString(" ")
    trace.addTrace(s"Learn '$learn'")
  }
  // learn a new unit clause (a literal)
  def learnUnit(lit: Int): Unit = {
    log(s"learnUnit: $lit")
    trace.addTrace(s"Learn Unit '$lit'")
  }
  // delete a clause
  def delete(clause: IConstr): Unit = {
    log(s"delete: $clause")
  }
  // a conflict has been found
  def conflictFound(confl: IConstr, dlevel: Int, trailLevel: Int): Unit = {
    log(s"conflictFound: $confl, $dlevel, $trailLevel")
    sat4jSolver match {
      case minisat: MiniSat[_] => {
        val trail = minisat.getTrail
        for (i <- 0 until trail.size) {
          val p: Int = trail.get(i)
          val reason: Constr = minisat.getReason(p)
          val x: Int = toDimacs(p)
          log(s"  trail($i) = $x, reason = $reason")
        }
        val trailLim = minisat.getTrailLim
        for (i <- 0 until trailLim.size) {
          log(s"  trailLim($i) = " + trailLim.get(i))
        }
      }
    }
    val trail = trailData(0, dlevel, confl) +: getCurrentTrail()
    trace.addTrace("Conflict found", trail)
  }
  // a conflict has been found while propagating values
  def conflictFound(lit: Int): Unit = {
    log(s"conflictFound: $lit") // ???
    trace.addTrace(s"Conflict found $lit", getCurrentTrail())
  }
  // a solution is found
  def solutionFound(model: Array[Int], lazyModel: RandomAccessModel): Unit = {
    log("solutionFound")
    trace.addTrace("Solution found", getCurrentTrail())
  }
  // starts a propagation
  def beginLoop(): Unit = {
    log("beginLoop")
  }
  // Start the search
  def start(): Unit = {
    log("start")
  }
  // End the search
  def end(result: Lbool): Unit = {
    log(s"end: $result")
    val s = if (result.toString == "T") "SAT" else "UNSAT"
    println(trace.traceString)
    trace.addTrace(s"End $s")
  }
  // The solver restarts the search
  def restarting(): Unit = {
    log("restarting")
  }
  // The solver is asked to backjump to a given decision level
  def backjump(backjumpLevel: Int): Unit = {
    log(s"backjump: $backjumpLevel")
    trace.addTrace(s"Backjump to level $backjumpLevel")
  }
  // The solver is going to delete some learned clauses
  def cleaning(): Unit = {
    log("cleaning")
  }

  def solve(assumptions: Seq[Int] = Seq.empty): (String,BitSet) = {
    sat4jSolver.setSearchListener(this);
    var set = BitSet.empty
    try {
      sat4jSolver.setTimeoutMs(timeout)
      if (sat4jSolver.isSatisfiable(new VecInt(assumptions.toArray))) {
        val model = sat4jSolver.model()
        for (i <- 0 until model.length) {
          if (model(i) > 0)
            set += model(i)
        }
        ("SAT", set)
      } else {
        ("UNSAT", set)
      }
    } catch {
      case e: ContradictionException => {
        ("UNSAT", BitSet.empty)
      }
      case e: TimeoutException => {
        println("TIMEOUT\n")
        ("TIMEOUT", BitSet.empty)
      }
      case e: Exception => {
        println(s"ERROR ${e.getMessage}\n")
        println(e)
        ("ERROR", BitSet.empty)
      }
    } finally {
      sat4jSolver.setTimeoutMs(0)
      sat4jSolver.reset
    }
  }
}
