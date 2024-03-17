export class DoublyLinkedListNode<T> {
  previous: DoublyLinkedListNode<T> | null = null;
  next: DoublyLinkedListNode<T> | null = null;
  constructor(public value: T) {}
}

/**
 * 双向链表
 * @export
 * @class DoublyLinkedList
 * @template T
 */
export class DoublyLinkedList<T> {
  protected readonly map = new Map<T, DoublyLinkedListNode<T>>();

  /**
   * 头节点
   * @type {(DoublyLinkedListNode<T> | null)}
   * @memberof DoublyLinkedList
   */
  head: DoublyLinkedListNode<T> | null = null;

  /**
   * 尾节点
   * @type {(DoublyLinkedListNode<T> | null)}
   * @memberof DoublyLinkedList
   */
  tail: DoublyLinkedListNode<T> | null = null;

  get size() {
    return this.map.size;
  }

  insertBefore(node: DoublyLinkedListNode<T> | null, value: T) {
    // 如果要插入的节点本身就存在此列表中，则需要先删除，再插入
    if (this.map.has(value)) {
      this.delete(value);
    }
    const newNode = new DoublyLinkedListNode(value);
    this.map.set(value, newNode);
    if (node === null) {
      if (this.head === node) {
        this.head = newNode;
      }
      if (this.tail === node) {
        this.tail = newNode;
      }
    } else {
      if (this.head === node) {
        this.head = newNode;
      }
      if ((newNode.previous = node.previous)) {
        newNode.previous.next = newNode;
      }
      newNode.next = node;
      node.previous = newNode;
    }
    return newNode;
  }

  insertAfter(node: DoublyLinkedListNode<T> | null, value: T) {
    if (this.map.has(value)) {
      this.delete(value);
    }
    const newNode = new DoublyLinkedListNode(value);
    this.map.set(value, newNode);
    if (node === null) {
      if (this.head === node) {
        this.head = newNode;
      }
      if (this.tail === node) {
        this.tail = newNode;
      }
    } else {
      if (this.tail === node) {
        this.tail = newNode;
      }
      if ((newNode.next = node.next)) {
        newNode.next.previous = newNode;
      }
      newNode.previous = node;
      node.next = newNode;
    }
    return newNode;
  }

  unshift(value: T) {
    return this.insertBefore(this.head, value);
  }

  push(value: T) {
    return this.insertAfter(this.tail, value);
  }

  shift(): T | null {
    if (this.head === null) {
      return null;
    }
    const value = this.head.value;
    this.delete(this.head);
    return value;
  }

  pop(): T | null {
    if (this.tail === null) {
      return null;
    }
    const value = this.tail.value;
    this.delete(this.tail);
    return value;
  }

  delete(node: DoublyLinkedListNode<T> | T) {
    if (!(node instanceof DoublyLinkedListNode)) {
      const realNode = this.map.get(node);
      if (!realNode) {
        return;
      }
      node = realNode;
    }
    this.map.delete(node.value);

    if (node.next === null && node.previous === null) {
      this.head = null;
      this.tail = null;
      return;
    }
    if (node.next) {
      if (!(node.next.previous = node.previous)) {
        this.head = node.next;
      }
    }
    if (node.previous) {
      if (!(node.previous.next = node.next)) {
        this.tail = node.previous;
      }
    }
  }

  clear() {
    let node = this.head;
    while (node !== null) {
      const next = node.next!;
      node.previous = null;
      node.next = null;
      node = next;
    }
    this.head = null;
    this.tail = null;
    this.map.clear();
  }

  toArray() {
    const nodes: DoublyLinkedListNode<T>[] = [];
    let currentNode = this.head;
    while (currentNode) {
      nodes.push(currentNode);
      currentNode = currentNode.next;
    }
    return nodes;
  }

  fromArray(array: T[]) {
    for (let i = 0; i < array.length; i++) {
      this.push(array[i]);
    }
    return this;
  }

  reverse() {
    let currentNode = this.head;
    let previousNode = null;
    let nextNode = null;
    while (currentNode) {
      nextNode = currentNode.next;
      previousNode = currentNode.previous;

      currentNode.next = previousNode;
      currentNode.previous = nextNode;

      previousNode = currentNode;
      currentNode = nextNode;
    }
    this.tail = this.head;
    this.head = previousNode;
    return this;
  }

  *[Symbol.iterator](): Iterator<T> {
    let node = this.head;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }
}
