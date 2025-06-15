export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatDateShort = (dateString: string): string => {
  if (!dateString) return "Non défini"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Date invalide"

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error("Erreur de formatage de date:", error)
    return "Date invalide"
  }
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const getProgressPercentage = (tontine: { duree: number; dateDebut: string }): number => {
  if (!tontine || !tontine.duree || tontine.duree === 0) return 0

  try {
    const currentMonth = getCurrentMonthNumber(tontine)
    const percentage = Math.round((currentMonth / tontine.duree) * 100)
    return Math.max(0, Math.min(100, percentage))
  } catch (error) {
    console.error("Erreur de calcul de progression:", error)
    return 0
  }
}

export const getCurrentMonthNumber = (tontine: { dateDebut: string; duree: number }): number => {
  if (!tontine || !tontine.dateDebut) return 0

  try {
    const startDate = new Date(tontine.dateDebut)
    if (isNaN(startDate.getTime())) return 0

    const currentDate = new Date()

    const monthsDiff =
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth()) + 1

    return Math.max(1, Math.min(monthsDiff, tontine.duree || 1))
  } catch (error) {
    console.error("Erreur de calcul du mois courant:", error)
    return 0
  }
}
