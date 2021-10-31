package web

import org.sat4j.minisat.orders.VarOrderHeap

class OrderBasic() extends VarOrderHeap {

  override def select(): Int = {

    val nblits = 2 * this.lits.nVars() + 1;

    for (i <- 2 to nblits if this.lits.isUnassigned(i)) {
      return i
    }

    return super.select()
  }

}
