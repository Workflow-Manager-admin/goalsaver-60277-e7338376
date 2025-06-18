import React from "react";

/**
 * A collection of static financial savings tips for users.
 */
const SAVINGS_TIPS = [
  "Automate your savings – set aside money as soon as you get paid.",
  "Treat savings like a bill: pay yourself first each month.",
  "Put spare change and cashbacks directly into your savings.",
  "Challenge yourself to a no-spend week or weekend.",
  "Review monthly subscriptions – cancel services you no longer need.",
  "Buy groceries with a list to avoid impulse purchases.",
  "Increase your savings rate with each raise or bonus.",
  "Set visual reminders for goals in your wallet or on your phone.",
  "Plan major purchases and research discounts beforehand.",
  "Use public transport or carpool to save on commuting costs.",
  "Cook at home more often – meal prep saves money!",
  "Avoid shopping when bored or stressed.",
  "Unsubscribe from shopping email lists to resist temptation.",
  "Celebrate small savings wins to stay motivated.",
  "Set a savings goal and track your progress visually.",
];

/**
 * Choose a random tip, or use a static one if you wish.
 */
function getRandomTip() {
  const index = Math.floor(Math.random() * SAVINGS_TIPS.length);
  return SAVINGS_TIPS[index];
}

/**
 * PUBLIC_INTERFACE
 * Render a pastel tip card in the new light theme.
 */
function TipToSave({ tip }) {
  const displayTip = tip || getRandomTip();
  return (
    <div className="tip-to-save" style={{
      background: "linear-gradient(92deg, #fff7e9 55%, #f7f3fa 100%)",
      color: "#8f5070",
      borderRadius: 12,
      margin: "18px 0 16px 0",
      padding: "15px 22px 14px 19px",
      fontSize: "1.18em",
      boxShadow: "0 3px 12px 0 #fce1ff42, 0 2px 7px #bae1fa18",
      display: "flex",
      gap: 14,
      alignItems: "flex-start"
    }}>
      <span className="tip-icon" role="img" aria-label="light bulb" style={{
        fontSize: "1.5em",
        marginRight: 9,
        filter: "drop-shadow(0 1px 8px #ffe0a570)"
      }}>
        💡
      </span>
      <span style={{flex: 1}}>{displayTip}</span>
    </div>
  );
}

export default TipToSave;
