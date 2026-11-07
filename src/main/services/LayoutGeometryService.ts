import { ComputerNode, TransitionLink, CalculationResult, ScreenDirection } from '../../shared/types';

export class LayoutGeometryService {
  /**
   * Automatically calculate Deskflow topological links from 2D canvas screen positions.
   * Generates bidirectional edge connections so cursor can travel freely in both directions.
   */
  public static calculateLinks(computers: ComputerNode[]): CalculationResult {
    if (!computers || computers.length < 2) {
      return {
        links: [],
        deskflowLinksSection: 'section: links\nend'
      };
    }

    const links: TransitionLink[] = [];

    // For every pair of screens (A, B)
    for (let i = 0; i < computers.length; i++) {
      for (let j = 0; j < computers.length; j++) {
        if (i === j) continue;

        const a = computers[i];
        const b = computers[j];

        // 1. Check if B is below A (A moves DOWN into B, and B moves UP back to A)
        if (this.isDirectlyBelow(a, b, computers)) {
          const overlap = this.getHorizontalOverlap(a, b);
          if (overlap) {
            const startA = Math.round(((overlap.start - a.x) / a.width) * 100);
            const endA = Math.round(((overlap.end - a.x) / a.width) * 100);
            const startB = Math.round(((overlap.start - b.x) / b.width) * 100);
            const endB = Math.round(((overlap.end - b.x) / b.width) * 100);

            // Clamp ranges (0-100)
            const clampedStartA = Math.max(0, Math.min(100, startA));
            const clampedEndA = Math.max(clampedStartA + 1, Math.min(100, endA));
            const clampedStartB = Math.max(0, Math.min(100, startB));
            const clampedEndB = Math.max(clampedStartB + 1, Math.min(100, endB));

            // Downward transition (A -> B)
            links.push({
              fromScreen: a.name,
              direction: 'down',
              fromRange: [clampedStartA, clampedEndA],
              toScreen: b.name,
              toRange: [clampedStartB, clampedEndB],
              isAutoCalculated: true
            });

            // Upward return transition (B -> A)
            links.push({
              fromScreen: b.name,
              direction: 'up',
              fromRange: [clampedStartB, clampedEndB],
              toScreen: a.name,
              toRange: [clampedStartA, clampedEndA],
              isAutoCalculated: true
            });
          }
        }

        // 2. Check if B is to the right of A (A moves RIGHT into B, and B moves LEFT back to A)
        if (this.isDirectlyRight(a, b, computers)) {
          const overlap = this.getVerticalOverlap(a, b);
          if (overlap) {
            const startA = Math.round(((overlap.start - a.y) / a.height) * 100);
            const endA = Math.round(((overlap.end - a.y) / a.height) * 100);
            const startB = Math.round(((overlap.start - b.y) / b.height) * 100);
            const endB = Math.round(((overlap.end - b.y) / b.height) * 100);

            const clampedStartA = Math.max(0, Math.min(100, startA));
            const clampedEndA = Math.max(clampedStartA + 1, Math.min(100, endA));
            const clampedStartB = Math.max(0, Math.min(100, startB));
            const clampedEndB = Math.max(clampedStartB + 1, Math.min(100, endB));

            // Rightward transition (A -> B)
            links.push({
              fromScreen: a.name,
              direction: 'right',
              fromRange: [clampedStartA, clampedEndA],
              toScreen: b.name,
              toRange: [clampedStartB, clampedEndB],
              isAutoCalculated: true
            });

            // Leftward return transition (B -> A)
            links.push({
              fromScreen: b.name,
              direction: 'left',
              fromRange: [clampedStartB, clampedEndB],
              toScreen: a.name,
              toRange: [clampedStartA, clampedEndA],
              isAutoCalculated: true
            });
          }
        }
      }
    }

    // Deduplicate any identical links
    const uniqueLinks: TransitionLink[] = [];
    for (const l of links) {
      const exists = uniqueLinks.some(
        (u) => u.fromScreen === l.fromScreen && u.direction === l.direction && u.toScreen === l.toScreen
      );
      if (!exists) {
        uniqueLinks.push(l);
      }
    }

    // Build the Deskflow links section text
    const deskflowLinksSection = this.generateLinksText(computers, uniqueLinks);

    return {
      links: uniqueLinks,
      deskflowLinksSection
    };
  }

  /**
   * Determine if B is directly below A (A's bottom edge faces B's top edge)
   */
  private static isDirectlyBelow(a: ComputerNode, b: ComputerNode, all: ComputerNode[]): boolean {
    const aBottom = a.y + a.height;
    const bTop = b.y;

    // B must be lower than or equal to A
    if (bTop < aBottom - 10) return false;

    // Must have horizontal overlap
    const overlap = this.getHorizontalOverlap(a, b);
    if (!overlap) return false;

    // Check if there is an intermediate screen between A and B
    for (const other of all) {
      if (other.id === a.id || other.id === b.id) continue;
      const otherTop = other.y;
      const otherBottom = other.y + other.height;

      // If other is between A and B vertically and overlaps horizontally
      if (otherTop >= aBottom - 5 && otherBottom <= bTop + 5) {
        const otherOverlap = this.getHorizontalOverlap(a, other);
        if (otherOverlap) {
          // An intermediate screen exists
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Determine if B is directly to the right of A (A's right edge faces B's left edge)
   */
  private static isDirectlyRight(a: ComputerNode, b: ComputerNode, all: ComputerNode[]): boolean {
    const aRight = a.x + a.width;
    const bLeft = b.x;

    // B must be to the right of A
    if (bLeft < aRight - 10) return false;

    // Must have vertical overlap
    const overlap = this.getVerticalOverlap(a, b);
    if (!overlap) return false;

    // Check if there is an intermediate screen between A and B
    for (const other of all) {
      if (other.id === a.id || other.id === b.id) continue;
      const otherLeft = other.x;
      const otherRight = other.x + other.width;

      // If other is between A and B horizontally and overlaps vertically
      if (otherLeft >= aRight - 5 && otherRight <= bLeft + 5) {
        const otherOverlap = this.getVerticalOverlap(a, other);
        if (otherOverlap) {
          return false;
        }
      }
    }

    return true;
  }

  private static getHorizontalOverlap(a: ComputerNode, b: ComputerNode): { start: number; end: number } | null {
    const start = Math.max(a.x, b.x);
    const end = Math.min(a.x + a.width, b.x + b.width);
    if (end - start > 10) {
      return { start, end };
    }
    return null;
  }

  private static getVerticalOverlap(a: ComputerNode, b: ComputerNode): { start: number; end: number } | null {
    const start = Math.max(a.y, b.y);
    const end = Math.min(a.y + a.height, b.y + b.height);
    if (end - start > 10) {
      return { start, end };
    }
    return null;
  }

  /**
   * Format links into Deskflow configuration section: links
   */
  public static generateLinksText(computers: ComputerNode[], links: TransitionLink[]): string {
    const lines: string[] = ['section: links'];

    for (const comp of computers) {
      const compLinks = links.filter((l) => l.fromScreen === comp.name);
      if (compLinks.length > 0) {
        lines.push(`\t${comp.name}:`);
        for (const l of compLinks) {
          // If coverage is approximately 0 to 100, simplify syntax, or output range
          const isFullFrom = l.fromRange[0] <= 5 && l.fromRange[1] >= 95;
          const isFullTo = l.toRange[0] <= 5 && l.toRange[1] >= 95;

          if (isFullFrom && isFullTo) {
            lines.push(`\t\t${l.direction} = ${l.toScreen}`);
          } else {
            lines.push(
              `\t\t${l.direction}(${l.fromRange[0]},${l.fromRange[1]}) = ${l.toScreen}(${l.toRange[0]},${l.toRange[1]})`
            );
          }
        }
      }
    }

    lines.push('end');
    return lines.join('\n');
  }
}
