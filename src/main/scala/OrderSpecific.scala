package web

import org.sat4j.minisat.orders.VarOrderHeap

class OrderSpecific(spec: Seq[Int]) extends VarOrderHeap {

  val specifiedOrder =
    for {
      lit <- spec
      sign = lit < 0
      varX = math.abs(lit)
      internalLit = if (sign) 2 * varX + 1 else 2 * varX
    } yield internalLit

  println(s"*** given spec ${spec.mkString(",")}")
  println(s"*** internal spec ${specifiedOrder.mkString(",")}")

  override def select(): Int = {
    for (i <- specifiedOrder if this.lits.isUnassigned(i)) {
      return i
    }
    return super.select()
  }

}
