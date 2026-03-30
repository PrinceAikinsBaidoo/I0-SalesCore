import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext(null)

const initialState = { items: [], discount: 0, customer: null }

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product.id === action.product.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: 1, discount: 0 }],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.product.id !== action.productId) }
    case 'UPDATE_QTY': {
      const qty = Math.max(1, action.quantity)
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.productId ? { ...i, quantity: qty } : i
        ),
      }
    }
    case 'UPDATE_ITEM_DISCOUNT':
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.productId ? { ...i, discount: Math.max(0, action.discount) } : i
        ),
      }
    case 'SET_DISCOUNT':
      return { ...state, discount: Math.max(0, action.discount) }
    case 'SET_CUSTOMER':
      return { ...state, customer: action.customer }
    case 'CLEAR':
      return initialState
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)

  const subtotal = cart.items.reduce((sum, i) => {
    const lineTotal = i.product.price * i.quantity - i.discount
    return sum + lineTotal
  }, 0)

  const total = Math.max(0, subtotal - cart.discount)

  return (
    <CartContext.Provider value={{ cart, dispatch, subtotal, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be within CartProvider')
  return ctx
}
